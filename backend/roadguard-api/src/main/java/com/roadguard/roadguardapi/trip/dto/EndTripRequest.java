package com.roadguard.roadguardapi.trip.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class EndTripRequest {

    @NotNull(message = "Trip ID is required")
    private UUID tripId;

    @NotNull(message = "End latitude is required")
    private Double endLat;

    @NotNull(message = "End longitude is required")
    private Double endLng;

    private String endAddress;

    private Double totalDistance;

    private Double averageSpeed;

    private Double maxSpeed;
}
