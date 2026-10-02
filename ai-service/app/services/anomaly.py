import logging
import math
from typing import Optional

from app.models.schemas import AnomalyResult
from app.utils import timeit

logger = logging.getLogger(__name__)


class AnomalyDetectionService:
    def __init__(self) -> None:
        self._prev_heading: Optional[float] = None

    def _compute_heading_change(self, current_heading: float) -> Optional[float]:
        if self._prev_heading is None:
            self._prev_heading = current_heading
            return None
        diff = abs(current_heading - self._prev_heading)
        if diff > 180:
            diff = 360 - diff
        self._prev_heading = current_heading
        return diff

    def _rule_based_analysis(
        self, sensor_data: dict, speed: Optional[float], heading: Optional[float]
    ) -> AnomalyResult:
        accel = sensor_data.get("accelerometer", {})
        gyro = sensor_data.get("gyroscope", {})

        if isinstance(accel, dict):
            ax = accel.get("x", 0.0)
            ay = accel.get("y", 0.0)
            az = accel.get("z", 0.0)
        else:
            ax = ay = az = 0.0

        if isinstance(gyro, dict):
            gx = gyro.get("x", 0.0)
            gy = gyro.get("y", 0.0)
            gz = gyro.get("z", 0.0)
        else:
            gx = gy = gy = gz = 0.0

        if heading is not None:
            heading_change = self._compute_heading_change(heading)
        else:
            heading_change = None

        vibration_magnitude = math.sqrt(ax**2 + ay**2 + az**2) * 9.81

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
            anomalies.sort(key=lambda x: x[3], reverse=True)
            anomaly_type, confidence, severity, _ = anomalies[0]
            return AnomalyResult(
                is_anomaly=True,
                anomaly_type=anomaly_type,
                confidence=round(confidence, 4),
                severity=severity,
            )

        return AnomalyResult(is_anomaly=False, confidence=0.0)

    @timeit
    def analyze(
        self, sensor_data: dict, speed: Optional[float] = None, heading: Optional[float] = None
    ) -> AnomalyResult:
        logger.debug("Analyzing sensor data: speed=%s, heading=%s", speed, heading)
        return self._rule_based_analysis(sensor_data, speed, heading)


anomaly_service = AnomalyDetectionService()
