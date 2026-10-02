package com.roadguard.roadguardapi.gps.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TripLocationDTO {

    private UUID id;
    private UUID tripId;
    private double latitude;
    private double longitude;
    private Double speed;
    private Double direction;
    private Double altitude;
    private Float accuracy;
    private Float bearing;
    private LocalDateTime timestamp;
}
