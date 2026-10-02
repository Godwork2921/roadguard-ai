package com.roadguard.roadguardapi.hazard.dto;

import com.roadguard.roadguardapi.hazard.entity.HazardVerification.VerificationAction;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class VerifyHazardRequest {

    @NotNull
    private UUID hazardId;

    @NotNull
    private VerificationAction action;

    private String notes;
}
