import logging
import random
from typing import List, Optional
from pathlib import Path

import cv2
import numpy as np
import httpx
from tensorflow.lite.python.interpreter import Interpreter

from app.config import settings
from app.models.schemas import DetectionResult
from app.utils import timeit

logger = logging.getLogger(__name__)

HAZARD_TYPES = ["POTHOLE", "FLOOD", "ROAD_CRACK", "DEBRIS", "BLOCKAGE"]

SEVERITY_MAP = {
    "POTHOLE": "MEDIUM",
    "FLOOD": "HIGH",
    "ROAD_CRACK": "LOW",
    "DEBRIS": "MEDIUM",
    "BLOCKAGE": "CRITICAL",
}


class HazardDetectionService:
    def __init__(self) -> None:
        self._interpreter: Optional[Interpreter] = None
        self._input_details: Optional[dict] = None
        self._output_details: Optional[dict] = None
        self._model_loaded: bool = False
        self._mock_mode: bool = False

    def load_model(self) -> None:
        model_path = Path(settings.model_path)
        if not model_path.exists():
            logger.warning("Model file not found at %s. Running in mock/demo mode.", model_path)
            self._mock_mode = True
            self._model_loaded = True
            return

        try:
            self._interpreter = Interpreter(model_path=str(model_path))
            self._interpreter.allocate_tensors()
            self._input_details = self._interpreter.get_input_details()
            self._output_details = self._interpreter.get_output_details()
            self._model_loaded = True
            logger.info("Model loaded successfully from %s", model_path)
        except Exception as exc:
            logger.error("Failed to load model: %s", exc)
            self._mock_mode = True
            self._model_loaded = True
            logger.warning("Falling back to mock/demo mode.")

    def preprocess_image(self, image: np.ndarray) -> np.ndarray:
        input_size = settings.model_input_size
        resized = cv2.resize(image, (input_size, input_size))
        normalized = resized.astype(np.float32) / 255.0
        input_tensor = np.expand_dims(normalized, axis=0)
        return input_tensor

    def _compute_severity(self, hazard_type: str, confidence: float) -> str:
        base = SEVERITY_MAP.get(hazard_type, "MEDIUM")
        if confidence > 0.95:
            severity_map = {"LOW": "MEDIUM", "MEDIUM": "HIGH", "HIGH": "CRITICAL", "CRITICAL": "CRITICAL"}
            return severity_map.get(base, base)
        return base

    def _mock_detect(self) -> List[DetectionResult]:
        hazard_type = random.choice(HAZARD_TYPES)
        confidence = random.uniform(settings.confidence_threshold, 1.0)
        severity = self._compute_severity(hazard_type, confidence)
        return [
            DetectionResult(
                hazard_type=hazard_type,
                confidence_score=round(confidence, 4),
                severity=severity,
                bounding_box=None,
                processing_time_ms=round(random.uniform(10, 50), 2),
            )
        ]

    @timeit
    def detect(self, image: np.ndarray) -> List[DetectionResult]:
        if not self._model_loaded:
            self.load_model()

        if self._mock_mode:
            return self._mock_detect()

        interpreter = self._interpreter
        input_details = self._input_details
        output_details = self._output_details
        if interpreter is None or input_details is None or output_details is None:
            raise RuntimeError("Model is not loaded.")

        input_tensor = self.preprocess_image(image)
        interpreter.set_tensor(input_details[0]["index"], input_tensor)
        interpreter.invoke()
        output_data = interpreter.get_tensor(output_details[0]["index"])

        results = []
        threshold = settings.confidence_threshold
        for detection in output_data[0]:
            class_id = int(detection[1])
            confidence = float(detection[2])
            if confidence >= threshold and class_id < len(HAZARD_TYPES):
                hazard_type = HAZARD_TYPES[class_id]
                ymin, xmin, ymax, xmax = detection[3:7]
                results.append(
                    DetectionResult(
                        hazard_type=hazard_type,
                        confidence_score=round(confidence, 4),
                        severity=self._compute_severity(hazard_type, confidence),
                        bounding_box={
                            "x_min": float(xmin),
                            "y_min": float(ymin),
                            "x_max": float(xmax),
                            "y_max": float(ymax),
                        },
                        processing_time_ms=0.0,
                    )
                )
        return results

    @timeit
    def detect_from_bytes(self, image_bytes: bytes) -> List[DetectionResult]:
        np_arr = np.frombuffer(image_bytes, np.uint8)
        image = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        if image is None:
            raise ValueError("Unable to decode image from bytes.")
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        return self.detect(image_rgb)

    @timeit
    async def detect_from_url(self, image_url: str) -> List[DetectionResult]:
        async with httpx.AsyncClient(timeout=settings.request_timeout_seconds) as client:
            response = await client.get(image_url)
            response.raise_for_status()
            return self.detect_from_bytes(response.content)


hazard_service = HazardDetectionService()
