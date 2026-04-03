from app.config import settings

_rash_streaks = {}

def _sanitize(value: float) -> float:
    return 0.0 if abs(value) < settings.RASH_NOISE_DEADZONE else value

def _bump_streak(session_id: str, event_key: str, triggered: bool) -> int:
    key = f"{session_id}:{event_key}"
    current = _rash_streaks.get(key, 0)
    current = current + 1 if triggered else max(0, current - 1)
    _rash_streaks[key] = current
    return current

def detect_rash(acceleration: float, brake: float, gyro: float, session_id: str) -> dict:
    """
    Detects rash driving patterns based on input telemetry.
    Returns standard evaluation.
    """
    acceleration = _sanitize(acceleration)
    brake = _sanitize(brake)
    gyro = _sanitize(gyro)

    is_harsh_accel = acceleration > settings.RASH_ACCEL_THRESHOLD
    is_hard_brake = brake < settings.RASH_BRAKE_THRESHOLD
    is_sharp_turn = abs(gyro) > settings.RASH_GYRO_THRESHOLD

    accel_streak = _bump_streak(session_id, "harsh_acceleration", is_harsh_accel)
    brake_streak = _bump_streak(session_id, "hard_brake", is_hard_brake)
    turn_streak = _bump_streak(session_id, "sharp_turn", is_sharp_turn)

    candidates = []
    if is_harsh_accel and accel_streak >= settings.RASH_MIN_CONSECUTIVE_HITS:
        candidates.append(("harsh_acceleration", acceleration))
    if is_hard_brake and brake_streak >= settings.RASH_BRAKE_MIN_CONSECUTIVE_HITS:
        candidates.append(("hard_brake", abs(brake)))
    if is_sharp_turn and turn_streak >= settings.RASH_MIN_CONSECUTIVE_HITS:
        candidates.append(("sharp_turn", abs(gyro)))

    is_rash = len(candidates) > 0
    event = None
    severity = "low"
    triggered_events = [name for name, _ in candidates]

    if is_rash:
        event, magnitude = max(candidates, key=lambda item: item[1])
        if event == "harsh_acceleration":
            high_threshold = settings.RASH_ACCEL_THRESHOLD * settings.RASH_ACCEL_HIGH_MULTIPLIER
            severity = "high" if magnitude > high_threshold else "medium"
        elif event == "hard_brake":
            high_threshold = abs(settings.RASH_BRAKE_THRESHOLD) * settings.RASH_BRAKE_HIGH_MULTIPLIER
            severity = "high" if magnitude > high_threshold else "medium"
        else:
            high_threshold = settings.RASH_GYRO_THRESHOLD * settings.RASH_GYRO_HIGH_MULTIPLIER
            severity = "high" if magnitude > high_threshold else "medium"

    return {
        "rash": is_rash,
        "event": event,
        "severity": severity,
        "events": triggered_events,
        "metrics": {
            "acceleration": acceleration,
            "brake": brake,
            "gyro": gyro,
            "streaks": {
                "harsh_acceleration": accel_streak,
                "hard_brake": brake_streak,
                "sharp_turn": turn_streak
            }
        },
    }
