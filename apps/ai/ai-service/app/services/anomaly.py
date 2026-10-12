import logging
import math
from typing import Optional

from app.models.schemas import AnomalyResult
from app.utils import timeit

logger = logging.getLogger(__name__)

GRAVITY = 9.81
MAX_TRACKED_SESSIONS = 1000


class AnomalyDetectionService:
    def __init__(self) -> None:
        self._prev_headings: dict[str, float] = {}

    def _compute_heading_change(self, current_heading: float, session_id: str) -> Optional[float]:
        if len(self._prev_headings) >= MAX_TRACKED_SESSIONS:
            self._prev_headings.clear()
        previous = self._prev_headings.get(session_id)
        self._prev_headings[session_id] = current_heading
        if previous is None:
            return None
        diff = abs(current_heading - previous)
        if diff > 180:
            diff = 360 - diff
        return diff

    def _rule_based_analysis(
        self,
        sensor_data: dict,
        speed: Optional[float],
        heading: Optional[float],
        session_id: str,
    ) -> AnomalyResult:
        accel = sensor_data.get("accelerometer", {})

        if isinstance(accel, dict):
            ax = accel.get("x", 0.0)
            ay = accel.get("y", 0.0)
            az = accel.get("z", 0.0)
        else:
            ax = ay = az = 0.0

        heading_change: Optional[float] = None
        if heading is not None:
            heading_change = self._compute_heading_change(heading, session_id)

        raw_magnitude = math.sqrt(ax**2 + ay**2 + az**2)
        dynamic_magnitude = math.sqrt(max(raw_magnitude**2 - GRAVITY**2, 0.0))
        vibration_magnitude = dynamic_magnitude * GRAVITY

        anomalies = []

        if ax < -5.0:
            anomalies.append(("SUDDEN_BRAKE", min(abs(ax) / 15.0, 1.0), "HIGH", 0.85))
        if ax > 4.0:
            anomalies.append(("HARD_ACCELERATION", min(ax / 10.0, 1.0), "MEDIUM", 0.75))
        if heading_change is not None and heading_change > 45.0:
            anomalies.append(("SHARP_TURN", min(heading_change / 90.0, 1.0), "HIGH", 0.80))
        if vibration_magnitude > 25.0:
            anomalies.append(("ROUGH_ROAD", min(vibration_magnitude / 50.0, 1.0), "LOW", 0.65))
        if speed is not None and heading_change is not None and heading_change > 30.0 and speed > 40.0:
            anomalies.append(("HIGH_SPEED_TURN", min((heading_change / 60.0) * (speed / 80.0), 1.0), "CRITICAL", 0.90))

        if anomalies:
            anomaly_type, confidence, severity, _ = anomalies[0]
            return AnomalyResult(
                is_anomaly=True,
                anomaly_type=anomaly_type,
                confidence=round(confidence, 4),
                severity=severity,
            )

        return AnomalyResult(is_anomaly=False, anomaly_type=None, confidence=0.0, severity=None)

    @timeit
    def analyze(
        self,
        sensor_data: dict,
        speed: Optional[float] = None,
        heading: Optional[float] = None,
        session_id: Optional[str] = None,
    ) -> AnomalyResult:
        logger.debug(
            "Analyzing sensor data: speed=%s, heading=%s, session=%s",
            speed,
            heading,
            session_id,
        )
        return self._rule_based_analysis(sensor_data, speed, heading, session_id or "default")


anomaly_service = AnomalyDetectionService()
