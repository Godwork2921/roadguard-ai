from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    model_path: str = "./models/hazard_detection.tflite"
    confidence_threshold: float = 0.8
    redis_url: str = "redis://localhost:6379"
    log_level: str = "INFO"
    model_input_size: int = 224
    max_image_size_mb: int = 10
    request_timeout_seconds: int = 30

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
