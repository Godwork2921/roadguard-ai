package com.roadguard.roadguardapi.route.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AlternativeRoute {

    private Integer riskScore;
    private Double totalDistance;
    private Long estimatedDuration;
    private Integer hazardCount;
    private String routeGeometry;
}
