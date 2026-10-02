package com.roadguard.roadguardapi.offline.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class OfflineHazardReportDTO {
    private String clientId;
    private String hazardType;
    private String severity;
    private double latitude;
    private double longitude;
    private String description;
    private String address;
    private List<String> imageUrls;
    private String source;
    private LocalDateTime detectedAt;
    private boolean isOffline = true;
}
