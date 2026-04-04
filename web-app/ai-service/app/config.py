from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    # App Settings
    APP_NAME: str = "Driver Safety ML Backend"
    VERSION: str = "1.0.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "development"

    # DB Config
    MONGODB_URI: str = "mongodb://localhost:27017/driver_safety"
    DB_NAME: str = "driver_safety"
    COLLECTION_NAME: str = "driver_events"

    # Push Notification / Central Backend Config
    BACKEND_URL: Optional[str] = "http://localhost:8000/api/v1/events"
    SOCKET_URL: str = "http://localhost:5000"

    # Thresholds for AI detection
    FATIGUE_EAR_THRESHOLD: float = 0.25 # Typical threshold for closed eyes
    FATIGUE_MAR_THRESHOLD: float = 0.7  # Typical threshold for yawning mouth
    FATIGUE_SMOOTHING_FRAMES: int = 3   # Consecutive frames below threshold to trigger drowsy state

    # Rash driving heuristics
    # Tuned defaults for heavier vehicle profile (bus):
    # - less sensitive to pedal jitter
    # - requires sustained aggressive behavior before flagging
    RASH_ACCEL_THRESHOLD: float = 3.4
    RASH_BRAKE_THRESHOLD: float = -4.4
    RASH_GYRO_THRESHOLD: float = 2.2
    RASH_NOISE_DEADZONE: float = 0.25
    RASH_MIN_CONSECUTIVE_HITS: int = 3
    RASH_BRAKE_MIN_CONSECUTIVE_HITS: int = 1
    RASH_ACCEL_HIGH_MULTIPLIER: float = 1.6
    RASH_BRAKE_HIGH_MULTIPLIER: float = 1.6
    RASH_GYRO_HIGH_MULTIPLIER: float = 1.6

    # Owner Alert Anti-Spam / Aggregation
    FATIGUE_ALERT_MIN_CONSECUTIVE: int = 2
    RASH_ALERT_MIN_CONSECUTIVE: int = 3
    FATIGUE_ALERT_COOLDOWN_SECONDS: int = 120
    RASH_ALERT_COOLDOWN_SECONDS: int = 45
    ALERT_STALE_RESET_SECONDS: int = 30

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

settings = Settings()
