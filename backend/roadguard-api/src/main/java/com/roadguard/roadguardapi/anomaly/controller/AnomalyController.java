package com.roadguard.roadguardapi.anomaly.controller;

import com.roadguard.roadguardapi.anomaly.dto.AnomalyAggregation;
import com.roadguard.roadguardapi.anomaly.dto.AnomalyEventDTO;
import com.roadguard.roadguardapi.anomaly.dto.ReportAnomalyRequest;
import com.roadguard.roadguardapi.anomaly.service.AnomalyDetectionService;
import com.roadguard.roadguardapi.common.response.ApiResponse;
import com.roadguard.roadguardapi.common.security.CurrentUser;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/anomalies")
@RequiredArgsConstructor
public class AnomalyController {

    private final AnomalyDetectionService anomalyDetectionService;

    @PostMapping("/report")
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<ApiResponse<AnomalyEventDTO>> reportAnomaly(
            @CurrentUser UUID userId,
            @Valid @RequestBody ReportAnomalyRequest request) {
        AnomalyEventDTO dto = anomalyDetectionService.reportAnomaly(userId, request);
        return ResponseEntity.ok(ApiResponse.success(dto, "Anomaly reported successfully"));
    }

    @GetMapping("/trip/{tripId}")
    @PreAuthorize("hasAnyRole('DRIVER', 'AUTHORITY_OFFICER', 'ADMINISTRATOR')")
    public ResponseEntity<ApiResponse<List<AnomalyEventDTO>>> getAnomaliesByTrip(
            @CurrentUser UUID userId,
            @PathVariable UUID tripId) {
        List<AnomalyEventDTO> anomalies = anomalyDetectionService.getAnomaliesByTrip(tripId, userId);
        return ResponseEntity.ok(ApiResponse.success(anomalies));
    }

    @GetMapping("/heatmap")
    @PreAuthorize("hasRole('AUTHORITY_OFFICER')")
    public ResponseEntity<ApiResponse<List<AnomalyAggregation>>> getHeatmap(
            @RequestParam double swLat,
            @RequestParam double swLng,
            @RequestParam double neLat,
            @RequestParam double neLng) {
        List<AnomalyAggregation> data = anomalyDetectionService.getAnomalyHeatmapData(swLat, swLng, neLat, neLng);
        return ResponseEntity.ok(ApiResponse.success(data));
    }
}
