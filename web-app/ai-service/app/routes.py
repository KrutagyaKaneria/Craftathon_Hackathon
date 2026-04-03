from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional

from app.utils import decode_image_base64, logger
from app.fatigue import detect_fatigue
from app.rash import detect_rash
from app.event_engine import process_event

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

# --- Endpoints ---

@router.get("/health")
async def health_check():
    return {"status": "ok"}

@router.post("/fatigue")
async def handle_fatigue(payload: FatigueRequest):
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
    result = detect_rash(payload.acceleration, payload.brake, payload.gyro)
    
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
    img = decode_image_base64(payload.image)
    if img is None:
        raise HTTPException(status_code=400, detail="Invalid Base64 image payload.")
    
    # Calculate both
    fatigue_res = detect_fatigue(img, payload.session_id)
    rash_res = detect_rash(payload.acceleration, payload.brake, payload.gyro)
    
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
