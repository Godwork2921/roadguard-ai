package com.roadguard.roadguardapi.anomaly.event;

import com.roadguard.roadguardapi.anomaly.entity.AnomalyEvent.AnomalyType;
import org.springframework.context.ApplicationEvent;

import java.time.LocalDateTime;

public class PotentialHazardDetectedEvent extends ApplicationEvent {

    private final double latitude;
    private final double longitude;
    private final long anomalyCount;
    private final AnomalyType anomalyType;
    private final LocalDateTime detectedAt;

    public PotentialHazardDetectedEvent(Object source, double latitude, double longitude,
                                        long anomalyCount, AnomalyType anomalyType,
                                        LocalDateTime detectedAt) {
        super(source);
        this.latitude = latitude;
        this.longitude = longitude;
        this.anomalyCount = anomalyCount;
        this.anomalyType = anomalyType;
        this.detectedAt = detectedAt;
    }

    public double getLatitude() { return latitude; }
    public double getLongitude() { return longitude; }
    public long getAnomalyCount() { return anomalyCount; }
    public AnomalyType getAnomalyType() { return anomalyType; }
    public LocalDateTime getDetectedAt() { return detectedAt; }
}
