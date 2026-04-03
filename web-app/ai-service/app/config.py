from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    # App Settings
    APP_NAME: str = "Driver Safety ML Backend"
    VERSION: str = "1.0.0"
    DEBUG: bool = False

    # DB Config
    MONGODB_URI: str = "mongodb://localhost:27017/driver_safety"
    DB_NAME: str = "driver_safety"
    COLLECTION_NAME: str = "driver_events"

    # Push Notification / Central Backend Config
    BACKEND_URL: Optional[str] = "http://localhost:8000/api/v1/events"

    # Thresholds for AI detection
    FATIGUE_EAR_THRESHOLD: float = 0.25 # Typical threshold for closed eyes
    FATIGUE_MAR_THRESHOLD: float = 0.7  # Typical threshold for yawning mouth
    FATIGUE_SMOOTHING_FRAMES: int = 3   # Consecutive frames below threshold to trigger drowsy state

    # Rash driving heuristics
    RASH_ACCEL_THRESHOLD: float = 3.0
    RASH_BRAKE_THRESHOLD: float = -4.0
    RASH_GYRO_THRESHOLD: float = 2.0

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

settings = Settings()
