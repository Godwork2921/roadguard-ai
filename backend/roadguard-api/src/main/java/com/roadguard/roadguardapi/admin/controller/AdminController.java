package com.roadguard.roadguardapi.admin.controller;

import com.roadguard.roadguardapi.admin.dto.AuditLogEntryDTO;
import com.roadguard.roadguardapi.admin.dto.SystemConfigDTO;
import com.roadguard.roadguardapi.admin.dto.SystemHealthDTO;
import com.roadguard.roadguardapi.admin.dto.UpdateSystemConfigRequest;
import com.roadguard.roadguardapi.admin.service.AdminService;
import com.roadguard.roadguardapi.common.response.ApiResponse;
import com.roadguard.roadguardapi.common.security.CurrentUser;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/health")
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public ApiResponse<SystemHealthDTO> getSystemHealth() {
        return ApiResponse.success(adminService.getSystemHealth());
    }

    @GetMapping("/users/stats")
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public ApiResponse<Map<String, Object>> getUserStats() {
        return ApiResponse.success(adminService.getUserManagementStats());
    }

    @GetMapping("/configs")
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public ApiResponse<List<SystemConfigDTO>> getConfigs() {
        return ApiResponse.success(adminService.getConfigs());
    }

    @PutMapping("/configs")
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public ApiResponse<SystemConfigDTO> updateConfig(
            @CurrentUser UUID adminId,
            @Valid @RequestBody UpdateSystemConfigRequest request) {
        return ApiResponse.success(adminService.updateConfig(adminId, request));
    }

    @GetMapping("/audit-logs")
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public ApiResponse<Page<AuditLogEntryDTO>> getAuditLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) UUID userId,
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) UUID entityId) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return ApiResponse.success(adminService.getAuditLogs(pageable, userId, entityType, entityId));
    }
}
