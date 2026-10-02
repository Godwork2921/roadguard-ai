package com.roadguard.roadguardapi.hazard.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
public class ResolveHazardRequest {

    @NotNull
    private UUID hazardId;

    private String resolutionNotes;

    private List<String> imageUrls;
}
