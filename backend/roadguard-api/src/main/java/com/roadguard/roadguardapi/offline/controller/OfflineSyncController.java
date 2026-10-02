package com.roadguard.roadguardapi.offline.controller;

import com.roadguard.roadguardapi.common.response.ApiResponse;
import com.roadguard.roadguardapi.common.security.CurrentUser;
import com.roadguard.roadguardapi.offline.dto.OfflineSyncRequest;
import com.roadguard.roadguardapi.offline.dto.OfflineSyncResponse;
import com.roadguard.roadguardapi.offline.service.OfflineSyncService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/sync")
public class OfflineSyncController {

    private final OfflineSyncService offlineSyncService;

    public OfflineSyncController(OfflineSyncService offlineSyncService) {
        this.offlineSyncService = offlineSyncService;
    }

    @PostMapping
    @PreAuthorize("hasRole('DRIVER')")
    public ApiResponse<OfflineSyncResponse> sync(
            @CurrentUser UUID userId,
            @Valid @RequestBody OfflineSyncRequest request) {
        return ApiResponse.success(offlineSyncService.syncData(userId, request));
    }

    @GetMapping("/status")
    @PreAuthorize("hasRole('DRIVER')")
    public ApiResponse<Map<String, Object>> getSyncStatus(@CurrentUser UUID userId) {
        return ApiResponse.success(offlineSyncService.getSyncStatus(userId));
    }
}
