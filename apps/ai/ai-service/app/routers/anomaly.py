import logging

from fastapi import APIRouter, HTTPException

from app.models.schemas import AnomalyRequest, AnomalyResult
from app.services.anomaly import anomaly_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1", tags=["anomaly"])


@router.post("/anomaly", response_model=AnomalyResult)
async def analyze_anomaly(request: AnomalyRequest) -> AnomalyResult:
    try:
        result = anomaly_service.analyze(
            sensor_data=request.sensor_data,
            speed=request.speed,
            heading=request.heading,
            session_id=request.session_id,
        )
    except Exception as exc:
        logger.exception("Anomaly analysis failed")
        raise HTTPException(status_code=500, detail="Internal anomaly analysis error.") from exc
    return result
