package com.roadguard.roadguardapi.hazard.controller;

import com.roadguard.roadguardapi.common.response.ApiResponse;
import com.roadguard.roadguardapi.common.response.PaginationMetadata;
import com.roadguard.roadguardapi.common.security.CurrentUser;
import com.roadguard.roadguardapi.hazard.dto.*;
import com.roadguard.roadguardapi.hazard.entity.HazardStatus;
import com.roadguard.roadguardapi.hazard.service.HazardService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/hazards")
public class HazardController {

    private final HazardService hazardService;

    public HazardController(HazardService hazardService) {
        this.hazardService = hazardService;
    }

    @PostMapping("/report")
    @PreAuthorize("hasAnyRole('DRIVER', 'AUTHORITY_OFFICER')")
    public ApiResponse<HazardDTO> reportHazard(
            @CurrentUser UUID userId,
            @Valid @RequestBody ReportHazardRequest request) {
        return ApiResponse.success(hazardService.reportHazard(userId, request));
    }

    @GetMapping("/nearby")
    public ApiResponse<List<HazardDTO>> getNearbyHazards(
            @RequestParam double lat,
            @RequestParam double lng,
            @RequestParam(defaultValue = "5.0") double radius) {
        return ApiResponse.success(hazardService.getNearbyHazards(lat, lng, radius));
    }

    @GetMapping("/bounds")
    public ApiResponse<List<HazardDTO>> getHazardsInBoundingBox(
            @RequestParam double swLat,
            @RequestParam double swLng,
            @RequestParam double neLat,
            @RequestParam double neLng) {
        return ApiResponse.success(hazardService.getHazardsInBoundingBox(swLat, swLng, neLat, neLng));
    }

    @GetMapping("/active")
    public ApiResponse<List<HazardDTO>> getActiveHazards() {
        return ApiResponse.success(hazardService.getActiveHazards());
    }

    @GetMapping("/{id}")
    public ApiResponse<HazardDTO> getHazardById(@PathVariable UUID id) {
        return ApiResponse.success(hazardService.getHazardById(id));
    }

    @PostMapping("/{id}/verify")
    @PreAuthorize("hasRole('AUTHORITY_OFFICER')")
    public ApiResponse<HazardDTO> verifyHazard(
            @CurrentUser UUID userId,
            @PathVariable UUID id,
            @Valid @RequestBody VerifyHazardRequest request) {
        request.setHazardId(id);
        return ApiResponse.success(hazardService.verifyHazard(userId, request));
    }

    @PostMapping("/{id}/assign")
    @PreAuthorize("hasRole('AUTHORITY_OFFICER')")
    public ApiResponse<HazardDTO> assignHazard(
            @CurrentUser UUID userId,
            @PathVariable UUID id,
            @Valid @RequestBody AssignHazardRequest request) {
        request.setHazardId(id);
        return ApiResponse.success(hazardService.assignHazard(userId, request));
    }

    @PostMapping("/{id}/resolve")
    @PreAuthorize("hasRole('AUTHORITY_OFFICER')")
    public ApiResponse<HazardDTO> resolveHazard(
            @CurrentUser UUID userId,
            @PathVariable UUID id,
            @Valid @RequestBody ResolveHazardRequest request) {
        request.setHazardId(id);
        return ApiResponse.success(hazardService.resolveHazard(userId, request));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMINISTRATOR', 'AUTHORITY_OFFICER')")
    public ApiResponse<List<HazardDTO>> getAllHazards(
            @RequestParam(required = false) HazardStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sort,
            @RequestParam(defaultValue = "desc") String direction) {
        Sort.Direction dir = Sort.Direction.fromString(direction);
        Pageable pageable = PageRequest.of(page, size, Sort.by(dir, sort));

        Page<HazardDTO> hazardPage;
        if (status != null) {
            hazardPage = hazardService.getHazardsByStatus(status, pageable);
        } else {
            hazardPage = hazardService.getAllHazards(pageable);
        }

        PaginationMetadata pagination = PaginationMetadata.builder()
                .page(hazardPage.getNumber())
                .size(hazardPage.getSize())
                .totalElements(hazardPage.getTotalElements())
                .totalPages(hazardPage.getTotalPages())
                .first(hazardPage.isFirst())
                .last(hazardPage.isLast())
                .build();

        return ApiResponse.success(hazardPage.getContent(), pagination);
    }
}
