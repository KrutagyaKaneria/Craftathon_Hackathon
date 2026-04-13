from datetime import datetime, timezone
import httpx
import asyncio
import cv2
from asyncio import create_task
from app.config import settings
from app.utils import logger
from app.db import insert_event
from app.socket_client import socket_manager
from app.memory_manager import get_alert_state, set_alert_state
from app.alert_retry import send_alert_with_retry
from app.fatigue import detect_fatigue

_monitor_stop_events: dict[str, asyncio.Event] = {}


def _monitor_id(driver_id: str, vehicle_id: str, session_id: str | None = None) -> str:
    if session_id:
        return session_id
    return f"{driver_id}:{vehicle_id}"


def is_monitor_active(driver_id: str, vehicle_id: str, session_id: str | None = None) -> bool:
    monitor_id = _monitor_id(driver_id, vehicle_id, session_id)
    return monitor_id in _monitor_stop_events


def stop_safety_monitor(driver_id: str, vehicle_id: str, session_id: str | None = None) -> bool:
    monitor_id = _monitor_id(driver_id, vehicle_id, session_id)
    stop_event = _monitor_stop_events.get(monitor_id)
    if not stop_event:
        return False
    stop_event.set()
    return True


async def start_safety_monitor(driver_id: str, vehicle_id: str, session_id: str | None = None):
    """
    Runs fatigue monitoring loop for a driving session.
    Uses cooperative async yielding to prevent event-loop starvation.
    """
    monitor_id = _monitor_id(driver_id, vehicle_id, session_id)

    if monitor_id in _monitor_stop_events:
        logger.warning(f"Safety monitor already running for {monitor_id}")
        return

    stop_event = asyncio.Event()
    _monitor_stop_events[monitor_id] = stop_event

    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        logger.error(f"Could not open camera for monitor {monitor_id}")
        _monitor_stop_events.pop(monitor_id, None)
        return

    logger.info(f"Safety monitor started for session {monitor_id}")

    try:
        while not stop_event.is_set():
            # Camera frame grab is blocking I/O, so run it in a worker thread.
            ret, frame = await asyncio.to_thread(cap.read)
            if not ret:
                await asyncio.sleep(0.05)
                continue

            fatigue_result = detect_fatigue(frame, monitor_id)
            if fatigue_result.get("event"):
                fatigue_score = fatigue_result.get("fatigue_score", 0.0)
                severity = "high" if fatigue_score > 0.7 else "medium" if fatigue_score >= 0.4 else "low"
                await process_event(
                    driver_id=driver_id,
                    session_id=monitor_id,
                    event_type="fatigue",
                    subtype=fatigue_result["event"],
                    severity=severity,
                    metrics=fatigue_result["metrics"],
                )

            # Critical cooperative pause to avoid event loop starvation.
            await asyncio.sleep(0.01)
    except Exception as exc:
        logger.error(f"Safety monitor crashed for {monitor_id}: {exc}")
    finally:
        cap.release()
        _monitor_stop_events.pop(monitor_id, None)
        logger.info(f"Safety monitor stopped for session {monitor_id}")

def _state_key(driver_id: str, session_id: str, event_type: str, subtype: str) -> str:
    return f"{driver_id}:{session_id}:{event_type}:{subtype}"

def _get_rule(event_type: str) -> tuple[int, int]:
    if event_type == "fatigue":
        return settings.FATIGUE_ALERT_MIN_CONSECUTIVE, settings.FATIGUE_ALERT_COOLDOWN_SECONDS
    return settings.RASH_ALERT_MIN_CONSECUTIVE, settings.RASH_ALERT_COOLDOWN_SECONDS

def _evaluate_owner_alert(event_payload: dict) -> tuple[bool, dict]:
    """
    Anti-spam algorithm:
    - Require N consecutive same events before first notification.
    - During cooldown, suppress repeats and aggregate count.
    - After cooldown, send one summary alert instead of every repeat.
    """
    severity = event_payload.get("severity", "low")
    if severity == "low":
        return False, {}

    event_type = event_payload["type"]
    key = _state_key(
        event_payload["driver_id"],
        event_payload["session_id"],
        event_type,
        event_payload["subtype"],
    )
    now = datetime.now(timezone.utc)
    min_consecutive, cooldown_seconds = _get_rule(event_type)

    state = get_alert_state(key)
    if not state:
        state = {
            "consecutive_hits": 0,
            "suppressed_count": 0,
            "last_event_at": None,
            "last_sent_at": None,
        }

    # Reset episode if the event stopped for a while.
    last_event_at = state.get("last_event_at")
    if last_event_at is not None and (now - last_event_at).total_seconds() > settings.ALERT_STALE_RESET_SECONDS:
        state["consecutive_hits"] = 0
        state["suppressed_count"] = 0
        state["last_sent_at"] = None

    state["consecutive_hits"] += 1
    state["last_event_at"] = now

    last_sent_at = state.get("last_sent_at")
    if state["consecutive_hits"] < min_consecutive:
        set_alert_state(key, state)
        return False, {
            "reason": "below_consecutive_threshold",
            "consecutive_hits": state["consecutive_hits"],
            "required_hits": min_consecutive,
            "suppressed_count": state["suppressed_count"],
        }

    if last_sent_at is None:
        state["last_sent_at"] = now
        meta = {
            "reason": "first_qualified_event",
            "consecutive_hits": state["consecutive_hits"],
            "required_hits": min_consecutive,
            "suppressed_count": state["suppressed_count"],
        }
        state["suppressed_count"] = 0
        set_alert_state(key, state)
        return True, meta

    elapsed_since_last_alert = (now - last_sent_at).total_seconds()
    if elapsed_since_last_alert < cooldown_seconds:
        state["suppressed_count"] += 1
        set_alert_state(key, state)
        return False, {
            "reason": "cooldown_active",
            "cooldown_seconds": cooldown_seconds,
            "elapsed_seconds": int(elapsed_since_last_alert),
            "suppressed_count": state["suppressed_count"],
            "consecutive_hits": state["consecutive_hits"],
            "required_hits": min_consecutive,
        }

    state["last_sent_at"] = now
    meta = {
        "reason": "cooldown_elapsed_summary",
        "consecutive_hits": state["consecutive_hits"],
        "required_hits": min_consecutive,
        "suppressed_count": state["suppressed_count"],
        "cooldown_seconds": cooldown_seconds,
    }
    state["suppressed_count"] = 0
    set_alert_state(key, state)
    return True, meta

async def send_backend_alert(event_payload: dict):
    """
    Sends a POST request to the backend for high severity events.
    Uses exponential backoff retry to handle network issues.
    """
    if not settings.BACKEND_URL:
        logger.warning("❌ No BACKEND_URL configured. Cannot send alert.")
        return

    # Use new retry mechanism with exponential backoff
    success = await send_alert_with_retry(event_payload, settings.BACKEND_URL)
    
    if not success:
        logger.error(f"🔴 CRITICAL: Failed to send high-severity alert after all retries")
        logger.error(f"   Driver: {event_payload.get('driver_id')}")
        logger.error(f"   Event: {event_payload.get('type')} / {event_payload.get('subtype')}")
        # Alert lost - can only log and hope the event was captured in DB

async def process_event(driver_id: str, session_id: str, event_type: str, subtype: str, severity: str, metrics: dict) -> dict:
    """
    Standardises event format, logs it to DB, and handles high severity alerts.
    """
    event_payload = {
        "driver_id": driver_id,
        "session_id": session_id,
        "type": event_type,
        "subtype": subtype,
        "severity": severity,
        "metrics": metrics,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    
    # DB insert mutates dict by adding Mongo _id, so copy to avoid
    # polluting outbound payload with non-serializable ObjectId.
    create_task(insert_event({**event_payload}))

    should_send, alert_meta = _evaluate_owner_alert(event_payload)
    event_payload["owner_alert"] = {
        "sent": should_send,
        **alert_meta,
    }
    if should_send:
        outbound_payload = {
            **event_payload,
            "owner_alert_summary": {
                "aggregation_window": alert_meta.get("reason"),
                "suppressed_count_since_last_sent": alert_meta.get("suppressed_count", 0),
                "consecutive_hits": alert_meta.get("consecutive_hits", 0),
            },
        }
        create_task(send_backend_alert(outbound_payload))
        # Also send via Socket.io for real-time owner notifications
        create_task(socket_manager.emit_alert(outbound_payload))
        
    return event_payload
