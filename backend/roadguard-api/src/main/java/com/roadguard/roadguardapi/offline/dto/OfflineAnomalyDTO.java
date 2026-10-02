package com.roadguard.roadguardapi.offline.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.Map;

@Data
public class OfflineAnomalyDTO {
    private String clientId;
    private double latitude;
    private double longitude;
    private String anomalyType;
    private Double speed;
    private Double acceleration;
    private Double heading;
    private Map<String, Object> rawSensorData;
    private LocalDateTime detectedAt;
    private boolean isOffline = true;
}
