package com.roadguard.roadguardapi.notification.dto;

import com.roadguard.roadguardapi.notification.entity.NotificationChannel;
import com.roadguard.roadguardapi.notification.entity.NotificationPriority;
import com.roadguard.roadguardapi.notification.entity.NotificationType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class SendNotificationRequest {
    @NotNull
    private UUID userId;

    @NotBlank
    private String title;

    @NotBlank
    private String message;

    @NotNull
    private NotificationType type;

    private String referenceType;

    private UUID referenceId;

    private NotificationPriority priority;

    private NotificationChannel channel;

    private String actionUrl;
}
