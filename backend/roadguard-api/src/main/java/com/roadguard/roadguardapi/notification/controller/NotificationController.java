package com.roadguard.roadguardapi.notification.controller;

import com.roadguard.roadguardapi.common.response.ApiResponse;
import com.roadguard.roadguardapi.common.security.CurrentUser;
import com.roadguard.roadguardapi.notification.dto.*;
import com.roadguard.roadguardapi.notification.entity.Notification;
import com.roadguard.roadguardapi.notification.entity.NotificationPreference;
import com.roadguard.roadguardapi.notification.mapper.NotificationMapper;
import com.roadguard.roadguardapi.notification.service.NotificationService;
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
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final NotificationMapper notificationMapper;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<NotificationDTO>>> getNotifications(
            @CurrentUser UUID userId,
            @PageableDefault(sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<Notification> notifications = notificationService.getNotifications(userId, pageable);
        Page<NotificationDTO> dtoPage = notifications.map(notificationMapper::toDto);
        return ResponseEntity.ok(ApiResponse.success(dtoPage));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<Long>> getUnreadCount(@CurrentUser UUID userId) {
        long count = notificationService.getUnreadCount(userId);
        return ResponseEntity.ok(ApiResponse.success(count));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(@PathVariable UUID id, @CurrentUser UUID userId) {
        notificationService.markAsRead(id, userId);
        return ResponseEntity.ok(ApiResponse.success(null, "Notification marked as read"));
    }

    @PutMapping("/read-all")
    public ResponseEntity<ApiResponse<Void>> markAllAsRead(@CurrentUser UUID userId) {
        notificationService.markAllAsRead(userId);
        return ResponseEntity.ok(ApiResponse.success(null, "All notifications marked as read"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteNotification(@PathVariable UUID id, @CurrentUser UUID userId) {
        notificationService.deleteNotification(id, userId);
        return ResponseEntity.ok(ApiResponse.success(null, "Notification deleted"));
    }

    @GetMapping("/preferences")
    public ResponseEntity<ApiResponse<List<NotificationPreferenceDTO>>> getPreferences(@CurrentUser UUID userId) {
        List<NotificationPreference> preferences = notificationService.getPreferences(userId);
        List<NotificationPreferenceDTO> dtoList = preferences.stream()
                .map(p -> NotificationPreferenceDTO.builder()
                        .id(p.getId())
                        .type(p.getType())
                        .enabled(p.isEnabled())
                        .pushEnabled(p.isPushEnabled())
                        .emailEnabled(p.isEmailEnabled())
                        .smsEnabled(p.isSmsEnabled())
                        .quietHoursStart(p.getQuietHoursStart())
                        .quietHoursEnd(p.getQuietHoursEnd())
                        .build())
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(dtoList));
    }

    @PutMapping("/preferences")
    public ResponseEntity<ApiResponse<NotificationPreferenceDTO>> updatePreference(
            @CurrentUser UUID userId,
            @Valid @RequestBody UpdateNotificationPreferenceRequest request) {
        NotificationPreference preference = notificationService.updatePreference(userId, request);
        NotificationPreferenceDTO dto = NotificationPreferenceDTO.builder()
                .id(preference.getId())
                .type(preference.getType())
                .enabled(preference.isEnabled())
                .pushEnabled(preference.isPushEnabled())
                .emailEnabled(preference.isEmailEnabled())
                .smsEnabled(preference.isSmsEnabled())
                .quietHoursStart(preference.getQuietHoursStart())
                .quietHoursEnd(preference.getQuietHoursEnd())
                .build();
        return ResponseEntity.ok(ApiResponse.success(dto));
    }

    @PostMapping("/send")
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public ResponseEntity<ApiResponse<NotificationDTO>> sendNotification(
            @Valid @RequestBody SendNotificationRequest request) {
        Notification notification = notificationService.sendNotification(
                request.getUserId(), request.getTitle(), request.getMessage(),
                request.getType(), request.getReferenceType(), request.getReferenceId(),
                request.getPriority(), request.getChannel(), request.getActionUrl());
        return ResponseEntity.ok(ApiResponse.success(notificationMapper.toDto(notification)));
    }
}
