from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel, Field
from typing import Optional

from app.utils import decode_image_base64, logger
from app.fatigue import detect_fatigue
from app.rash import detect_rash
from app.event_engine import process_event, start_safety_monitor, stop_safety_monitor, is_monitor_active
from app.face_verify import verify_face
from app.socket_client import socket_manager
from app.memory_manager import alert_state_manager, cleanup_on_session_end
from app.database_validator import DatabaseValidator
from app.db import db_instance

router = APIRouter()

# --- Pydantic Request Models ---

class FatigueRequest(BaseModel):
    image: str = Field(..., description="Base64 encoded image string")
    driver_id: str
    session_id: str

class RashRequest(BaseModel):
    acceleration: float
    brake: float
    gyro: float
    driver_id: str
    session_id: str

class AnalyzeRequest(BaseModel):
    image: str = Field(..., description="Base64 encoded image string")
    acceleration: float
    brake: float
    gyro: float
    driver_id: str
    session_id: str

class FaceVerifyRequest(BaseModel):
    stored_image: str
    captured_image: str

class StartSessionRequest(BaseModel):
    driverId: str
    vehicleId: str
    sessionId: Optional[str] = None

# --- Endpoints ---

@router.get("/health")
async def health_check():
    """Health check endpoint. Returns active sessions info."""
    active_sessions = socket_manager.get_active_sessions()
    return {
        "status": "ok",
        "socket_connected": socket_manager.is_connected,
        "active_sessions": len(active_sessions),
        "tracked_sessions": list(active_sessions.keys())
    }

@router.get("/diagnostics")
async def get_diagnostics():
    """
    Get detailed diagnostics about system health.
    Includes database status, memory usage, and connection info.
    """
    validator = DatabaseValidator(db_instance.client, db_instance.db)
    db_diagnostics = await validator.get_database_diagnostics()
    db_ready = await validator.is_database_ready_for_sessions()
    
    memory_stats = alert_state_manager.get_stats()
    active_sessions = socket_manager.get_active_sessions()
    
    return {
        "status": "ok",
        "database": {
            "ready": db_ready,
            **db_diagnostics
        },
        "memory": {
            "alert_states": memory_stats
        },
        "socket": {
            "connected": socket_manager.is_connected,
            "active_sessions": len(active_sessions)
        }
    }

@router.post("/session-ended")
async def handle_session_ended(payload: dict):
    """
    Webhook to clean up alert state when a session ends.
    Called by backend when session_ended event is fired.
    
    Payload: { "session_id": "...", "driver_id": "...", "vehicle_id": "..." }
    """
    session_id = payload.get("session_id")
    driver_id = payload.get("driver_id")
    
    if not session_id:
        logger.error("❌ Session-ended request missing session_id")
        raise HTTPException(status_code=400, detail="session_id is required")
    
    logger.info(f"🧹 Cleaning up alert state for session_id: {session_id}, driver_id: {driver_id}")
    
    try:
        # Stop any in-flight camera monitor loop for this session.
        if driver_id:
            monitor_stopped = stop_safety_monitor(driver_id, payload.get("vehicle_id", "unknown"), session_id)
            if monitor_stopped:
                logger.info(f"⏹️  Monitoring loop stop requested for session_id: {session_id}")

        # Clean up all alert states associated with this session
        cleanup_on_session_end(session_id)
        logger.info(f"✅ Alert state cleanup complete for session_id: {session_id}")
        
        return {
            "status": "cleaned",
            "session_id": session_id,
            "driver_id": driver_id,
            "message": "Alert state cleaned up successfully"
        }
    except Exception as e:
        logger.error(f"❌ Error during session cleanup: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Cleanup failed: {str(e)}")

@router.post("/api/sessions/start")
async def start_driving_session(payload: StartSessionRequest, background_tasks: BackgroundTasks):
    """
    Starts AI monitoring in the background so the API response returns immediately.
    """
    monitor_running = is_monitor_active(payload.driverId, payload.vehicleId, payload.sessionId)
    if monitor_running:
        return {
            "success": True,
            "message": "AI Monitoring already running",
            "session_info": {
                "driverId": payload.driverId,
                "vehicleId": payload.vehicleId,
                "sessionId": payload.sessionId,
            },
        }

    background_tasks.add_task(
        start_safety_monitor,
        payload.driverId,
        payload.vehicleId,
        payload.sessionId,
    )

    return {
        "success": True,
        "message": "AI Monitoring initiated",
        "session_info": {
            "driverId": payload.driverId,
            "vehicleId": payload.vehicleId,
            "sessionId": payload.sessionId,
        },
    }

@router.post("/fatigue")
async def handle_fatigue(payload: FatigueRequest):
    """Process fatigue detection. Validates session is active before processing."""
    # Validate session ID is provided
    if not payload.session_id:
        logger.error("❌ Fatigue request missing session_id")
        raise HTTPException(status_code=400, detail="session_id is required")
    
    # Log session validation for debugging
    is_active = socket_manager.is_session_active(payload.session_id)
    logger.info(f"🔍 Fatigue check - Session {payload.session_id} active: {is_active}")
    
    if not is_active:
        logger.warning(f"⚠️ Fatigue request for inactive session: {payload.session_id}")
    
    img = decode_image_base64(payload.image)
    if img is None:
        raise HTTPException(status_code=400, detail="Invalid Base64 image payload.")
        
    result = detect_fatigue(img, payload.session_id)
    
    # Process event only if an event is detected
    event_payload = None
    if result.get("event"):
        # Calculate severity based on fatigue rules
        severity = "high" if result["fatigue_score"] > 0.7 else "medium" if result["fatigue_score"] >= 0.4 else "low"
        event_payload = await process_event(
            driver_id=payload.driver_id,
            session_id=payload.session_id,
            event_type="fatigue",
            subtype=result["event"],
            severity=severity,
            metrics=result["metrics"]
        )
        
    return {
        "fatigue": result,
        "event_logged": event_payload
    }

@router.post("/rash")
async def handle_rash(payload: RashRequest):
    """Process rash driving detection. Validates session is active before processing."""
    # Validate session ID is provided
    if not payload.session_id:
        logger.error("❌ Rash request missing session_id")
        raise HTTPException(status_code=400, detail="session_id is required")
    
    # Log session validation for debugging
    is_active = socket_manager.is_session_active(payload.session_id)
    logger.info(f"🔍 Rash check - Session {payload.session_id} active: {is_active}")
    
    if not is_active:
        logger.warning(f"⚠️ Rash request for inactive session: {payload.session_id}")
    
    result = detect_rash(payload.acceleration, payload.brake, payload.gyro, payload.session_id)
    
    event_payload = None
    if result.get("rash"):
        event_payload = await process_event(
            driver_id=payload.driver_id,
            session_id=payload.session_id,
            event_type="rash",
            subtype=result["event"],
            severity=result["severity"],
            metrics=result["metrics"]
        )
        
    return {
        "rash_driving": result,
        "event_logged": event_payload
    }

@router.post("/analyze")
async def handle_analyze(payload: AnalyzeRequest):
    """Process combined fatigue and rash detection. Validates session is active before processing."""
    # Validate session ID is provided
    if not payload.session_id:
        logger.error("❌ Analyze request missing session_id")
        raise HTTPException(status_code=400, detail="session_id is required")
    
    # Log session validation for debugging
    is_active = socket_manager.is_session_active(payload.session_id)
    logger.info(f"🔍 Analyze check - Session {payload.session_id} active: {is_active}")
    
    if not is_active:
        logger.warning(f"⚠️ Analyze request for inactive session: {payload.session_id}")
    
    img = decode_image_base64(payload.image)
    if img is None:
        raise HTTPException(status_code=400, detail="Invalid Base64 image payload.")
    
    # Calculate both
    fatigue_res = detect_fatigue(img, payload.session_id)
    rash_res = detect_rash(payload.acceleration, payload.brake, payload.gyro, payload.session_id)
    
    # Process Fatigue Event
    fatigue_event = None
    if fatigue_res.get("event"):
        severity = "high" if fatigue_res["fatigue_score"] > 0.7 else "medium" if fatigue_res["fatigue_score"] >= 0.4 else "low"
        fatigue_event = await process_event(
            driver_id=payload.driver_id,
            session_id=payload.session_id,
            event_type="fatigue",
            subtype=fatigue_res["event"],
            severity=severity,
            metrics=fatigue_res["metrics"]
        )
        
    # Process Rash Event
    rash_event = None
    if rash_res.get("rash"):
        rash_event = await process_event(
            driver_id=payload.driver_id,
            session_id=payload.session_id,
            event_type="rash",
            subtype=rash_res["event"],
            severity=rash_res["severity"],
            metrics=rash_res["metrics"]
        )
        
    # Standardise Driver Risk Score as requested in Bonus
    driver_risk_score = min(
        100, 
        int(fatigue_res["fatigue_score"] * 50) + (50 if rash_res.get("severity") == "high" else 25 if rash_res.get("severity") == "medium" else 0)
    )

    return {
        "driver_risk_score": driver_risk_score,
        "fatigue": fatigue_res,
        "rash_driving": rash_res,
        "events_logged": {
            "fatigue": fatigue_event,
            "rash": rash_event
        }
    }

@router.post("/verify-face")
async def handle_verify_face(payload: FaceVerifyRequest):
    logger.info("Face verification request received")
    result = verify_face(payload.stored_image, payload.captured_image)
    return result
