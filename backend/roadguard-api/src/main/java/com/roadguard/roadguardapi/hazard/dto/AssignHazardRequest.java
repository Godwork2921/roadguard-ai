package com.roadguard.roadguardapi.hazard.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class AssignHazardRequest {

    @NotNull
    private UUID hazardId;

    @NotBlank
    private String assignedTo;

    private String priority;
}
