package com.roadguard.roadguardapi.route.controller;

import com.roadguard.roadguardapi.common.response.ApiResponse;
import com.roadguard.roadguardapi.common.response.PaginationMetadata;
import com.roadguard.roadguardapi.common.security.CurrentUser;
import com.roadguard.roadguardapi.route.dto.RouteAnalysisRequest;
import com.roadguard.roadguardapi.route.dto.RouteAnalysisResponse;
import com.roadguard.roadguardapi.route.entity.RiskZone;
import com.roadguard.roadguardapi.route.entity.RouteAnalysis;
import com.roadguard.roadguardapi.route.service.RouteAnalysisService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/routes")
@RequiredArgsConstructor
public class RouteController {

    private final RouteAnalysisService routeAnalysisService;

    @PostMapping("/analyze")
    @PreAuthorize("hasAnyRole('DRIVER', 'AUTHORITY_OFFICER', 'ADMINISTRATOR')")
    public ResponseEntity<ApiResponse<RouteAnalysisResponse>> analyzeRoute(
            @CurrentUser UUID userId,
            @Valid @RequestBody RouteAnalysisRequest request) {
        RouteAnalysisResponse response = routeAnalysisService.analyzeRoute(userId, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Route analysis completed"));
    }

    @GetMapping("/history")
    @PreAuthorize("hasAnyRole('DRIVER', 'AUTHORITY_OFFICER', 'ADMINISTRATOR')")
    public ResponseEntity<ApiResponse<List<RouteAnalysisResponse>>> getHistory(
            @CurrentUser UUID userId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<RouteAnalysisResponse> history = routeAnalysisService.getRouteAnalysisHistory(userId, pageable);
        PaginationMetadata pagination = PaginationMetadata.builder()
            .page(history.getNumber())
            .size(history.getSize())
            .totalElements(history.getTotalElements())
            .totalPages(history.getTotalPages())
            .first(history.isFirst())
            .last(history.isLast())
            .build();
        return ResponseEntity.ok(ApiResponse.success(history.getContent(), pagination));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('DRIVER', 'AUTHORITY_OFFICER', 'ADMINISTRATOR')")
    public ResponseEntity<ApiResponse<RouteAnalysis>> getRouteById(
            @CurrentUser UUID userId,
            @PathVariable UUID id) {
        RouteAnalysis analysis = routeAnalysisService.getRouteById(id, userId);
        return ResponseEntity.ok(ApiResponse.success(analysis));
    }

    @GetMapping("/risk-zones")
    public ResponseEntity<ApiResponse<List<RiskZone>>> getRiskZones(
            @RequestParam double swLat,
            @RequestParam double swLng,
            @RequestParam double neLat,
            @RequestParam double neLng) {
        List<RiskZone> zones = routeAnalysisService.getRiskZonesInArea(swLat, swLng, neLat, neLng);
        return ResponseEntity.ok(ApiResponse.success(zones));
    }
}
