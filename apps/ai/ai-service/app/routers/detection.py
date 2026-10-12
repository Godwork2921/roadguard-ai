import logging
import time

from fastapi import APIRouter, File, UploadFile, HTTPException
from pydantic import BaseModel

from app.models.schemas import DetectionResult, BatchDetectionResult
from app.services.detector import hazard_service
from app.utils import validate_image_size

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1", tags=["detection"])


class ImageUrlPayload(BaseModel):
    image_url: str


@router.post("/detect", response_model=DetectionResult)
async def detect_hazard(file: UploadFile = File(...)) -> DetectionResult:
    if file.content_type and not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image.")
    image_bytes = await file.read()
    validate_image_size(image_bytes)
    start = time.perf_counter()
    try:
        results = hazard_service.detect_from_bytes(image_bytes)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        logger.exception("Detection failed for file %s", file.filename)
        raise HTTPException(status_code=500, detail="Internal detection error.") from exc
    elapsed = (time.perf_counter() - start) * 1000
    if not results:
        raise HTTPException(status_code=404, detail="No hazards detected.")
    result = results[0]
    result.processing_time_ms = round(elapsed, 2)
    return result


@router.post("/detect-url", response_model=DetectionResult)
async def detect_hazard_url(payload: ImageUrlPayload) -> DetectionResult:
    start = time.perf_counter()
    try:
        results = await hazard_service.detect_from_url(payload.image_url)
    except Exception as exc:
        logger.exception("Detection failed for URL %s", payload.image_url)
        raise HTTPException(status_code=500, detail=f"Failed to process URL: {exc}")
    elapsed = (time.perf_counter() - start) * 1000
    if not results:
        raise HTTPException(status_code=404, detail="No hazards detected.")
    result = results[0]
    result.processing_time_ms = round(elapsed, 2)
    return result


class BatchUrlPayload(BaseModel):
    image_urls: list[str]


@router.post("/batch-detect", response_model=BatchDetectionResult)
async def batch_detect(payload: BatchUrlPayload) -> BatchDetectionResult:
    all_results = []
    for url in payload.image_urls:
        try:
            results = await hazard_service.detect_from_url(url)
            all_results.extend(results)
        except Exception as exc:
            logger.warning("Batch detection failed for URL %s: %s", url, exc)
    if not all_results:
        raise HTTPException(status_code=404, detail="No hazards detected in batch.")
    return BatchDetectionResult(results=all_results)
