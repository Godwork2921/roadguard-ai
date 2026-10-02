package com.roadguard.roadguardapi.notification.dto;

import com.roadguard.roadguardapi.notification.entity.NotificationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationPreferenceDTO {
    private UUID id;
    private NotificationType type;
    private boolean enabled;
    private boolean pushEnabled;
    private boolean emailEnabled;
    private boolean smsEnabled;
    private LocalTime quietHoursStart;
    private LocalTime quietHoursEnd;
}
