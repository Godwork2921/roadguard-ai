package com.roadguard.roadguardapi.route.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
@Builder
public class RouteAnalysisResponse {

    private UUID routeId;
    private Integer riskScore;
    private String riskLevel;
    private Double totalDistance;
    private Long estimatedDuration;
    private String estimatedDurationFormatted;
    private Integer hazardCount;
    private List<HazardSummary> hazards;
    private boolean safeRoute;
    private String routeGeometry;
    private List<AlternativeRoute> alternativeRoutes;
    private List<String> warnings;
}
