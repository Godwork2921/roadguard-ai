package com.roadguard.roadguardapi.hazard.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HazardDTO {

    private UUID id;
    private String hazardType;
    private String severity;
    private String status;
    private double latitude;
    private double longitude;
    private String description;
    private String address;
    private Double confidenceScore;
    private UUID reportedById;
    private String reportedByName;
    private UUID verifiedById;
    private String verifiedByName;
    private boolean isVerified;
    private boolean isAIDetected;
    private String source;
    private String region;
    private String roadName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime resolvedAt;
    private List<String> imageUrls;
}
