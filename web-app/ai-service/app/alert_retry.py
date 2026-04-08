"""
Alert Retry Mechanism with Exponential Backoff
Ensures critical alerts eventually reach the backend despite network issues
"""

import asyncio
import httpx
from app.config import settings
from app.utils import logger


class AlertRetryConfig:
    """Configuration for alert retry behavior"""
    
    MAX_ATTEMPTS = 5  # Try up to 5 times
    INITIAL_DELAY_MS = 500  # Start with 500ms delay
    MAX_DELAY_MS = 30000  # Cap at 30 seconds
    BACKOFF_MULTIPLIER = 2  # Exponential: 500ms → 1s → 2s → 4s → 8s
    TIMEOUT_SECONDS = 5.0  # HTTP request timeout


async def send_alert_with_retry(event_payload: dict, backend_url: str = None) -> bool:
    """
    Sends alert to backend with exponential backoff retry
    
    Args:
        event_payload: Alert event to send
        backend_url: Backend URL (defaults to settings.BACKEND_URL)
        
    Returns:
        True if alert was successfully sent, False if all retries exhausted
    """
    if backend_url is None:
        backend_url = settings.BACKEND_URL
    
    if not backend_url:
        logger.warning("❌ No BACKEND_URL configured. Cannot send alert.")
        return False
    
    event_type = event_payload.get("type", "unknown")
    driver_id = event_payload.get("driver_id", "unknown")
    severity = event_payload.get("severity", "unknown")
    
    logger.info(f"📤 Attempting to send {severity} {event_type} alert for driver {driver_id}")
    logger.info(f"   Max {AlertRetryConfig.MAX_ATTEMPTS} attempts with exponential backoff")
    
    last_error = None
    
    for attempt in range(1, AlertRetryConfig.MAX_ATTEMPTS + 1):
        try:
            async with httpx.AsyncClient(timeout=AlertRetryConfig.TIMEOUT_SECONDS) as client:
                response = await client.post(backend_url, json=event_payload)
                
                if response.status_code < 400:
                    # Success!
                    logger.info(f"✅ Alert sent successfully on attempt {attempt}/{AlertRetryConfig.MAX_ATTEMPTS}")
                    logger.info(f"   Status: {response.status_code}")
                    return True
                else:
                    # Server error (4xx/5xx) - worth retrying
                    last_error = f"HTTP {response.status_code}: {response.text[:100]}"
                    logger.warning(f"⚠️  Attempt {attempt}/{AlertRetryConfig.MAX_ATTEMPTS} failed: {last_error}")
        
        except asyncio.TimeoutError:
            last_error = "Request timeout"
            logger.warning(f"⚠️  Attempt {attempt}/{AlertRetryConfig.MAX_ATTEMPTS} timeout: Connection timed out after {AlertRetryConfig.TIMEOUT_SECONDS}s")
        
        except httpx.ConnectError:
            last_error = "Connection failed"
            logger.warning(f"⚠️  Attempt {attempt}/{AlertRetryConfig.MAX_ATTEMPTS}: Cannot connect to backend")
        
        except httpx.NetworkError as e:
            last_error = str(e)
            logger.warning(f"⚠️  Attempt {attempt}/{AlertRetryConfig.MAX_ATTEMPTS}: Network error - {last_error}")
        
        except Exception as e:
            last_error = str(e)
            logger.error(f"❌ Attempt {attempt}/{AlertRetryConfig.MAX_ATTEMPTS}: Unexpected error - {last_error}")
        
        # Calculate backoff delay for next attempt
        if attempt < AlertRetryConfig.MAX_ATTEMPTS:
            delay_ms = min(
                AlertRetryConfig.INITIAL_DELAY_MS * (AlertRetryConfig.BACKOFF_MULTIPLIER ** (attempt - 1)),
                AlertRetryConfig.MAX_DELAY_MS
            )
            delay_seconds = delay_ms / 1000
            
            logger.info(f"   ⏳ Waiting {delay_seconds:.1f}s before retry...")
            await asyncio.sleep(delay_seconds)
    
    # All retries exhausted
    logger.error(f"❌ Alert delivery failed after {AlertRetryConfig.MAX_ATTEMPTS} attempts")
    logger.error(f"   Last error: {last_error}")
    logger.error(f"   Event: {event_type} severity={severity} driver={driver_id}")
    logger.error(f"   Backend URL: {backend_url}")
    
    return False


async def send_critical_alert_fire_and_forget(event_payload: dict, backend_url: str = None) -> None:
    """
    Fire-and-forget version that logs errors but doesn't block
    Useful for background alert sending
    
    Args:
        event_payload: Alert event to send
        backend_url: Backend URL (defaults to settings.BACKEND_URL)
    """
    try:
        success = await send_alert_with_retry(event_payload, backend_url)
        if not success:
            logger.error(f"🔴 CRITICAL: High-severity alert could not be delivered after all retries")
            logger.error(f"   This alert may need manual review: {event_payload.get('driver_id')}")
    except Exception as e:
        logger.error(f"❌ Unexpected error in alert retry logic: {e}")
