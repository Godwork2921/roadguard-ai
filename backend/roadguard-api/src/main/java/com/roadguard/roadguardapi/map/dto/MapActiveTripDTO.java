package com.roadguard.roadguardapi.map.dto;

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
public class MapActiveTripDTO {
    private UUID id;
    private UUID driverId;
    private String driverName;
    private double latitude;
    private double longitude;
    private Double speed;
    private Double direction;
    private LocalDateTime timestamp;
}
