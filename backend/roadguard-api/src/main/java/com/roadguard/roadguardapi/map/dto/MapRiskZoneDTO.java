package com.roadguard.roadguardapi.map.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MapRiskZoneDTO {
    private UUID id;
    private String name;
    private String riskLevel;
    private double latitude;
    private double longitude;
    private double radiusMeters;
    private String colorCode;
}
