package com.roadguard.roadguardapi.trip.dto;

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
public class TripDTO {

    private UUID id;
    private UUID driverId;
    private String driverName;
    private Double startLat;
    private Double startLng;
    private Double endLat;
    private Double endLng;
    private String startAddress;
    private String endAddress;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String status;
    private Integer riskScore;
    private Double totalDistance;
    private Double averageSpeed;
    private Double maxSpeed;
}
