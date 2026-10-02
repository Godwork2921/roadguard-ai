package com.roadguard.roadguardapi.notification.dto;

import com.roadguard.roadguardapi.notification.entity.NotificationChannel;
import com.roadguard.roadguardapi.notification.entity.NotificationPriority;
import com.roadguard.roadguardapi.notification.entity.NotificationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationDTO {
    private UUID id;
    private UUID userId;
    private String title;
    private String message;
    private NotificationType type;
    private String referenceType;
    private UUID referenceId;
    private boolean isRead;
    private LocalDateTime readAt;
    private String actionUrl;
    private NotificationPriority priority;
    private LocalDateTime sentAt;
    private NotificationChannel channel;
    private LocalDateTime createdAt;
}
