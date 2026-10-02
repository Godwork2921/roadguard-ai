package com.roadguard.roadguardapi.map.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MapHazardDTO {
    private UUID id;
    private String type;
    private String severity;
    private double latitude;
    private double longitude;
    private String status;
    private LocalDateTime reportedAt;
    private LocalDateTime verifiedAt;
    private LocalDateTime resolvedAt;
    private Double confidenceScore;
}
