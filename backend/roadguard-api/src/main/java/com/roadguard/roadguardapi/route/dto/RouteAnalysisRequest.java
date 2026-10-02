package com.roadguard.roadguardapi.route.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class RouteAnalysisRequest {

    @NotNull
    private double startLat;

    @NotNull
    private double startLng;

    @NotNull
    private double endLat;

    @NotNull
    private double endLng;

    private String startAddress;

    private String endAddress;

    private boolean includeAlternatives = true;
}
