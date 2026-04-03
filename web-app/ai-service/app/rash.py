from app.config import settings

def detect_rash(acceleration: float, brake: float, gyro: float) -> dict:
    """
    Detects rash driving patterns based on input telemetry.
    Returns standard evaluation.
    """
    is_rash = False
    event = None
    severity = "low"
    
    # Check conditions based on configured thresholds
    is_harsh_accel = acceleration > settings.RASH_ACCEL_THRESHOLD
    is_hard_brake = brake < settings.RASH_BRAKE_THRESHOLD  # Brake is negative accel
    is_sharp_turn = abs(gyro) > settings.RASH_GYRO_THRESHOLD
    
    # Determine the Event that happened
    if is_harsh_accel:
        is_rash = True
        event = "harsh_acceleration"
        # Increase severity linearly depending on how much it surpassed threshold
        severity = "high" if acceleration > (settings.RASH_ACCEL_THRESHOLD * 1.5) else "medium"
        
    elif is_hard_brake:
        is_rash = True
        event = "hard_brake"
        severity = "high" if brake < (settings.RASH_BRAKE_THRESHOLD * 1.5) else "medium"
        
    elif is_sharp_turn:
        is_rash = True
        event = "sharp_turn"
        severity = "high" if abs(gyro) > (settings.RASH_GYRO_THRESHOLD * 1.5) else "medium"

    return {
        "rash": is_rash,
        "event": event,
        "severity": severity,
        "metrics": {
            "acceleration": acceleration,
            "brake": brake,
            "gyro": gyro
        }
    }
