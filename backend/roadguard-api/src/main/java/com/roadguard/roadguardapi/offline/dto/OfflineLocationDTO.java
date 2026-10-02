package com.roadguard.roadguardapi.offline.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class OfflineLocationDTO {
    private String clientId;
    private String tripClientId;
    private double latitude;
    private double longitude;
    private Double speed;
    private Double direction;
    private Double altitude;
    private Float accuracy;
    private LocalDateTime timestamp;
    private boolean isOffline = true;
}
