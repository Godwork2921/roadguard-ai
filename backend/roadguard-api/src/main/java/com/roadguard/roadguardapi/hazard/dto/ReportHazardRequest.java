package com.roadguard.roadguardapi.hazard.dto;

import com.roadguard.roadguardapi.hazard.entity.HazardSeverity;
import com.roadguard.roadguardapi.hazard.entity.HazardType;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class ReportHazardRequest {

    @NotNull
    private HazardType hazardType;

    @NotNull
    private HazardSeverity severity;

    @NotNull
    private double latitude;

    @NotNull
    private double longitude;

    private String description;

    private String address;

    private List<String> imageUrls;

    private String source;
}
