package com.roadguard.roadguardapi.analytics.controller;

import com.roadguard.roadguardapi.analytics.dto.AnalyticsQuery;
import com.roadguard.roadguardapi.analytics.dto.DashboardStatsDTO;
import com.roadguard.roadguardapi.analytics.dto.DataPoint;
import com.roadguard.roadguardapi.analytics.dto.RoadDangerStats;
import com.roadguard.roadguardapi.analytics.service.AnalyticsService;
import com.roadguard.roadguardapi.common.constants.RoleConstants;
import com.roadguard.roadguardapi.common.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/dashboard")
    @PreAuthorize(RoleConstants.HAS_ROLE_ADMIN_OR_AUTHORITY)
    public ResponseEntity<ApiResponse<DashboardStatsDTO>> getDashboard() {
        DashboardStatsDTO stats = analyticsService.getDashboardStats();
        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    @GetMapping("/trips/trend")
    @PreAuthorize(RoleConstants.HAS_ROLE_ADMIN_OR_AUTHORITY)
    public ResponseEntity<ApiResponse<List<DataPoint>>> getTripTrend(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(defaultValue = "DAY") String groupBy) {
        if (startDate == null) startDate = LocalDate.now().minusDays(30);
        if (endDate == null) endDate = LocalDate.now();
        List<DataPoint> trend = analyticsService.getTripTrend(startDate, endDate, groupBy);
        return ResponseEntity.ok(ApiResponse.success(trend));
    }

    @GetMapping("/hazards/trend")
    @PreAuthorize(RoleConstants.HAS_ROLE_ADMIN_OR_AUTHORITY)
    public ResponseEntity<ApiResponse<List<DataPoint>>> getHazardTrend(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(defaultValue = "DAY") String groupBy) {
        if (startDate == null) startDate = LocalDate.now().minusDays(30);
        if (endDate == null) endDate = LocalDate.now();
        List<DataPoint> trend = analyticsService.getHazardTrend(startDate, endDate, groupBy);
        return ResponseEntity.ok(ApiResponse.success(trend));
    }

    @GetMapping("/hazards/by-type")
    @PreAuthorize(RoleConstants.HAS_ROLE_ADMIN_OR_AUTHORITY)
    public ResponseEntity<ApiResponse<Map<String, Long>>> getHazardByType() {
        Map<String, Long> distribution = analyticsService.getHazardByTypeDistribution();
        return ResponseEntity.ok(ApiResponse.success(distribution));
    }

    @GetMapping("/hazards/by-severity")
    @PreAuthorize(RoleConstants.HAS_ROLE_ADMIN_OR_AUTHORITY)
    public ResponseEntity<ApiResponse<Map<String, Long>>> getHazardBySeverity() {
        Map<String, Long> distribution = analyticsService.getHazardBySeverityDistribution();
        return ResponseEntity.ok(ApiResponse.success(distribution));
    }

    @GetMapping("/roads/dangerous")
    @PreAuthorize(RoleConstants.HAS_ROLE_ADMIN_OR_AUTHORITY)
    public ResponseEntity<ApiResponse<List<RoadDangerStats>>> getDangerousRoads(
            @RequestParam(defaultValue = "10") int limit) {
        List<RoadDangerStats> roads = analyticsService.getTopDangerousRoads(limit);
        return ResponseEntity.ok(ApiResponse.success(roads));
    }

    @GetMapping("/query")
    @PreAuthorize(RoleConstants.HAS_ROLE_ADMIN_OR_AUTHORITY)
    public ResponseEntity<ApiResponse<DashboardStatsDTO>> queryAnalytics(AnalyticsQuery query) {
        DashboardStatsDTO stats = analyticsService.getAllStats(query);
        return ResponseEntity.ok(ApiResponse.success(stats));
    }
}
