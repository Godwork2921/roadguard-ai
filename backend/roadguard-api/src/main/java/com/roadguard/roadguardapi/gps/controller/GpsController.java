package com.roadguard.roadguardapi.gps.controller;

import com.roadguard.roadguardapi.common.response.ApiResponse;
import com.roadguard.roadguardapi.common.security.CurrentUser;
import com.roadguard.roadguardapi.gps.dto.LocationUpdateRequest;
import com.roadguard.roadguardapi.gps.dto.TripLocationDTO;
import com.roadguard.roadguardapi.gps.service.GpsTrackingService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/gps")
public class GpsController {

    private final GpsTrackingService gpsTrackingService;

    public GpsController(GpsTrackingService gpsTrackingService) {
        this.gpsTrackingService = gpsTrackingService;
    }

    @PostMapping("/location")
    @PreAuthorize("hasRole('DRIVER')")
    public ApiResponse<TripLocationDTO> updateLocation(
            @CurrentUser UUID userId,
            @Valid @RequestBody LocationUpdateRequest request) {
        return ApiResponse.success(gpsTrackingService.updateLocation(userId, request));
    }

    @GetMapping("/trips/{tripId}/locations")
    @PreAuthorize("hasRole('DRIVER')")
    public ApiResponse<List<TripLocationDTO>> getTripLocations(
            @CurrentUser UUID userId,
            @PathVariable UUID tripId) {
        return ApiResponse.success(gpsTrackingService.getTripLocations(tripId, userId));
    }

    @GetMapping("/trips/{tripId}/latest")
    @PreAuthorize("hasRole('DRIVER')")
    public ApiResponse<TripLocationDTO> getLatestLocation(
            @CurrentUser UUID userId,
            @PathVariable UUID tripId) {
        return ApiResponse.success(gpsTrackingService.getLatestLocation(tripId));
    }

    @GetMapping("/trips/{tripId}/locations/range")
    @PreAuthorize("hasRole('DRIVER')")
    public ApiResponse<List<TripLocationDTO>> getLocationsInTimeRange(
            @CurrentUser UUID userId,
            @PathVariable UUID tripId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {
        return ApiResponse.success(gpsTrackingService.getLocationsInTimeRange(tripId, start, end));
    }
}
