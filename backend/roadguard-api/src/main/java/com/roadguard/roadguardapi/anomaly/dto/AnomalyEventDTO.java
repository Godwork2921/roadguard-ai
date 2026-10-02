package com.roadguard.roadguardapi.anomaly.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class AnomalyEventDTO {

    private UUID id;
    private double latitude;
    private double longitude;
    private String anomalyType;
    private String severity;
    private Double speed;
    private Double acceleration;
    private Double heading;
    private UUID driverId;
    private UUID tripId;
    private Double confidenceScore;
    private LocalDateTime detectedAt;
    private boolean isVerified;
    private boolean isHazardCreated;
}
