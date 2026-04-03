from datetime import datetime, timezone
import httpx
from asyncio import create_task
from app.config import settings
from app.utils import logger
from app.db import insert_event

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
    
    # Run DB insert concurrently, no need to block the response
    create_task(insert_event(event_payload))

    # Run Alert push concurrently if severity is high
    if severity == "high":
        create_task(send_backend_alert(event_payload))
        
    return event_payload
