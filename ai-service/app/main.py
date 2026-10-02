import logging
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import config
from app.models.schemas import HealthResponse
from app.routers import detection, anomaly
from app.services.detector import hazard_service
from app.utils import setup_logging

setup_logging()
logger = logging.getLogger(__name__)
_start_time: float = time.time()


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting RoadGuard AI Service...")
    hazard_service.load_model()
    yield
    logger.info("Shutting down RoadGuard AI Service...")


app = FastAPI(
    title="RoadGuard AI Service",
    description="Computer vision hazard detection and anomaly analysis for RoadGuard AI",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(detection.router)
app.include_router(anomaly.router)


@app.get("/api/v1/health", response_model=HealthResponse)
async def health_check():
    return HealthResponse(
        status="healthy",
        model_loaded=hazard_service._model_loaded,
        uptime=round(time.time() - _start_time, 2),
    )
