from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_path: str = "./models/hazard_detection.tflite"
    confidence_threshold: float = 0.8
    redis_url: str = "redis://localhost:6379"
    log_level: str = "INFO"
    model_input_size: int = 224
    max_image_size_mb: int = 10
    request_timeout_seconds: int = 30

    # Comma-separated list of browser origins allowed to call this service.
    # The AI service is primarily invoked server-to-server by roadguard-api, so
    # this only matters for direct browser access (e.g. Swagger UI from a dev
    # frontend). Never "*": pairing a wildcard origin with credentialed
    # requests is rejected by browsers and would expose the service publicly.
    cors_origins: str = "http://localhost:3000,http://localhost:5173"

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()
