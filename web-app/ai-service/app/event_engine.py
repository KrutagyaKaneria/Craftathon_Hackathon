from datetime import datetime, timezone
import httpx
from asyncio import create_task
from app.config import settings
from app.utils import logger
from app.db import insert_event

_alert_state = {}

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

    state = _alert_state.get(
        key,
        {
            "consecutive_hits": 0,
            "suppressed_count": 0,
            "last_event_at": None,
            "last_sent_at": None,
        },
    )

    # Reset episode if the event stopped for a while.
    last_event_at = state["last_event_at"]
    if last_event_at is not None and (now - last_event_at).total_seconds() > settings.ALERT_STALE_RESET_SECONDS:
        state["consecutive_hits"] = 0
        state["suppressed_count"] = 0
        state["last_sent_at"] = None

    state["consecutive_hits"] += 1
    state["last_event_at"] = now

    last_sent_at = state["last_sent_at"]
    if state["consecutive_hits"] < min_consecutive:
        _alert_state[key] = state
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
        _alert_state[key] = state
        return True, meta

    elapsed_since_last_alert = (now - last_sent_at).total_seconds()
    if elapsed_since_last_alert < cooldown_seconds:
        state["suppressed_count"] += 1
        _alert_state[key] = state
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
    _alert_state[key] = state
    return True, meta

async def send_backend_alert(event_payload: dict):
    """
    Sends a POST request to the central backend for high severity events.
    Fails silently in terms of API response, writing solely to logs.
    """
    if not settings.BACKEND_URL:
        logger.warning("No BACKEND_URL configured. Skipping alert.")
        return

    try:
        async with httpx.AsyncClient() as client:
            logger.info(f"Sending HIGH severity alert to {settings.BACKEND_URL}")
            response = await client.post(settings.BACKEND_URL, json=event_payload, timeout=5.0)
            if response.status_code >= 400:
                logger.error(f"Failed to send alert. Status {response.status_code}: {response.text}")
            else:
                logger.info(f"Alert sent successfully: {response.status_code}")
    except Exception as e:
        logger.error(f"Exception while sending alert to backend: {e}")

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
        
    return event_payload
