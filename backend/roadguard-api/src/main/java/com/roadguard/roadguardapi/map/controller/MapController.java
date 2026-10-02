package com.roadguard.roadguardapi.map.controller;

import com.roadguard.roadguardapi.common.response.ApiResponse;
import com.roadguard.roadguardapi.common.security.CurrentUser;
import com.roadguard.roadguardapi.map.dto.MapAnomalyDTO;
import com.roadguard.roadguardapi.map.dto.MapDataDTO;
import com.roadguard.roadguardapi.map.dto.MapHazardDTO;
import com.roadguard.roadguardapi.map.dto.MapRiskZoneDTO;
import com.roadguard.roadguardapi.map.service.MapDataService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/map")
public class MapController {

    private final MapDataService mapDataService;

    public MapController(MapDataService mapDataService) {
        this.mapDataService = mapDataService;
    }

    @GetMapping("/data")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<MapDataDTO> getMapData(
            @CurrentUser UUID userId,
            @RequestParam double swLat,
            @RequestParam double swLng,
            @RequestParam double neLat,
            @RequestParam double neLng) {
        return ApiResponse.success(mapDataService.getMapData(swLat, swLng, neLat, neLng));
    }

    @GetMapping("/hazards")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<List<MapHazardDTO>> getHazards(
            @RequestParam double swLat,
            @RequestParam double swLng,
            @RequestParam double neLat,
            @RequestParam double neLng) {
        return ApiResponse.success(mapDataService.getHazardsInBounds(swLat, swLng, neLat, neLng));
    }

    @GetMapping("/risk-zones")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<List<MapRiskZoneDTO>> getRiskZones(
            @RequestParam double swLat,
            @RequestParam double swLng,
            @RequestParam double neLat,
            @RequestParam double neLng) {
        return ApiResponse.success(mapDataService.getRiskZonesInBounds(swLat, swLng, neLat, neLng));
    }
}
