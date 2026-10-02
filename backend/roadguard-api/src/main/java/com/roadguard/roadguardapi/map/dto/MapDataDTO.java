package com.roadguard.roadguardapi.map.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MapDataDTO {
    private List<MapHazardDTO> hazards;
    private List<MapRiskZoneDTO> riskZones;
    private List<MapActiveTripDTO> activeTrips;
    private List<MapAnomalyDTO> anomalies;
}
