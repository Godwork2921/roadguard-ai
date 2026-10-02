package com.roadguard.roadguardapi.trip.controller;

import com.roadguard.roadguardapi.common.response.ApiResponse;
import com.roadguard.roadguardapi.common.security.CurrentUser;
import com.roadguard.roadguardapi.trip.dto.EndTripRequest;
import com.roadguard.roadguardapi.trip.dto.StartTripRequest;
import com.roadguard.roadguardapi.trip.dto.TripDTO;
import com.roadguard.roadguardapi.trip.service.TripService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/trips")
public class TripController {

    private final TripService tripService;

    public TripController(TripService tripService) {
        this.tripService = tripService;
    }

    @PostMapping("/start")
    public ApiResponse<TripDTO> startTrip(
            @CurrentUser UUID userId,
            @Valid @RequestBody StartTripRequest request) {
        return ApiResponse.success(tripService.startTrip(userId, request));
    }

    @PostMapping("/end")
    public ApiResponse<TripDTO> endTrip(
            @CurrentUser UUID userId,
            @Valid @RequestBody EndTripRequest request) {
        return ApiResponse.success(tripService.endTrip(userId, request));
    }

    @GetMapping("/active")
    public ApiResponse<TripDTO> getActiveTrip(@CurrentUser UUID userId) {
        return ApiResponse.success(tripService.getActiveTrip(userId));
    }

    @GetMapping("/history")
    public ApiResponse<Page<TripDTO>> getTripHistory(
            @CurrentUser UUID userId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ApiResponse.success(tripService.getTripHistory(userId, pageable));
    }

    @GetMapping("/{id}")
    public ApiResponse<TripDTO> getTripById(
            @CurrentUser UUID userId,
            @PathVariable UUID id) {
        return ApiResponse.success(tripService.getTripById(id, userId));
    }

    @GetMapping("/area")
    @PreAuthorize("hasRole('AUTHORITY_OFFICER')")
    public ApiResponse<List<TripDTO>> getActiveTripsInArea(
            @RequestParam double swLat,
            @RequestParam double swLng,
            @RequestParam double neLat,
            @RequestParam double neLng) {
        return ApiResponse.success(tripService.getActiveTripsInArea(swLat, swLng, neLat, neLng));
    }
}
