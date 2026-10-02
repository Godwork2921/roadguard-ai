package com.roadguard.roadguardapi.notification.dto;

import com.roadguard.roadguardapi.notification.entity.NotificationType;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalTime;

@Data
public class UpdateNotificationPreferenceRequest {
    @NotNull
    private NotificationType type;

    private Boolean enabled;

    private Boolean pushEnabled;

    private Boolean emailEnabled;

    private Boolean smsEnabled;

    private LocalTime quietHoursStart;

    private LocalTime quietHoursEnd;
}
