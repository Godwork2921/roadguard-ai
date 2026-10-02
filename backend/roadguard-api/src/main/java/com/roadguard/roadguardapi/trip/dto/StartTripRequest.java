package com.roadguard.roadguardapi.trip.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class StartTripRequest {

    @NotNull(message = "Start latitude is required")
    private Double startLat;

    @NotNull(message = "Start longitude is required")
    private Double startLng;

    private String startAddress;

    @NotNull(message = "End latitude is required")
    private Double endLat;

    @NotNull(message = "End longitude is required")
    private Double endLng;

    private String endAddress;

    private UUID vehicleId;
}
