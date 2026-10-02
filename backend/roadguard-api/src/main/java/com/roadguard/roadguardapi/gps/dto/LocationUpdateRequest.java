package com.roadguard.roadguardapi.gps.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class LocationUpdateRequest {

    @NotNull
    private UUID tripId;

    @NotNull
    private double latitude;

    @NotNull
    private double longitude;

    private Double speed;

    private Double direction;

    private Double altitude;

    private Float accuracy;

    private Float bearing;

    @NotNull
    private LocalDateTime timestamp;
}
