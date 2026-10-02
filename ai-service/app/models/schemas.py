from pydantic import BaseModel, Field
from typing import Optional, Dict, List


class DetectionResult(BaseModel):
    hazard_type: str = Field(..., description="Type of hazard detected")
    confidence_score: float = Field(..., ge=0.0, le=1.0, description="Model confidence score")
    severity: str = Field(..., description="Severity level: LOW, MEDIUM, HIGH, CRITICAL")
    bounding_box: Optional[Dict[str, float]] = Field(None, description="Bounding box coordinates")
    processing_time_ms: float = Field(..., description="Processing time in milliseconds")


class BatchDetectionResult(BaseModel):
    results: List[DetectionResult] = Field(..., description="List of detection results")


class AnomalyRequest(BaseModel):
    sensor_data: Dict = Field(..., description="Sensor data including accelerometer, gyroscope values")
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    speed: Optional[float] = Field(None, ge=0.0)
    heading: Optional[float] = Field(None, ge=0.0, le=360.0)


class AnomalyResult(BaseModel):
    is_anomaly: bool = Field(..., description="Whether anomaly was detected")
    anomaly_type: Optional[str] = Field(None, description="Type of anomaly detected")
    confidence: float = Field(..., ge=0.0, le=1.0)
    severity: Optional[str] = Field(None, description="Severity level")


class HealthResponse(BaseModel):
    status: str = Field(..., description="Service status")
    model_loaded: bool = Field(..., description="Whether ML model is loaded")
    uptime: float = Field(..., description="Service uptime in seconds")
