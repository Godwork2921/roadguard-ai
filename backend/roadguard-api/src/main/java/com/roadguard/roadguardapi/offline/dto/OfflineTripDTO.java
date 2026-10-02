package com.roadguard.roadguardapi.offline.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class OfflineTripDTO {
    private String clientId;
    private Double startLat;
    private Double startLng;
    private Double endLat;
    private Double endLng;
    private String startAddress;
    private String endAddress;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Double totalDistance;
    private Double averageSpeed;
    private Double maxSpeed;
    private String status;
    private boolean isOffline = true;
}
