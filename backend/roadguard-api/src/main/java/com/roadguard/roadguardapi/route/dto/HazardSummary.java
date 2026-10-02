package com.roadguard.roadguardapi.route.dto;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class HazardSummary {

    private UUID id;
    private String type;
    private String severity;
    private double latitude;
    private double longitude;
    private Double distance;
    private String description;
}
