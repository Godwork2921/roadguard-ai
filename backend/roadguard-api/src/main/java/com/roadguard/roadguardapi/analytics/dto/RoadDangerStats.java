package com.roadguard.roadguardapi.analytics.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoadDangerStats {
    private String roadName;
    private long hazardCount;
    private Double avgSeverity;
    private double latitude;
    private double longitude;
}
