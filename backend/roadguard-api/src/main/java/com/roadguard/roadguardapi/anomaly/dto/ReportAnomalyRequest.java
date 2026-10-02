package com.roadguard.roadguardapi.anomaly.dto;

import com.roadguard.roadguardapi.anomaly.entity.AnomalyEvent.AnomalyType;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Data
public class ReportAnomalyRequest {

    @NotNull
    private double latitude;

    @NotNull
    private double longitude;

    @NotNull
    private AnomalyType anomalyType;

    private Double speed;

    private Double acceleration;

    private Double heading;

    @NotNull
    private UUID tripId;

    private String deviceId;

    private Map<String, Object> rawSensorData;

    @NotNull
    private LocalDateTime detectedAt;
}
