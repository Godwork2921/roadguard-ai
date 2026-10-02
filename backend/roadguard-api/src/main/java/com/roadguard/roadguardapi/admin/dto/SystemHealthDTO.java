package com.roadguard.roadguardapi.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SystemHealthDTO {
    private String status;
    private String uptime;
    private long activeUsers;
    private long activeTrips;
    private long pendingHazards;
    private String databaseStatus;
    private String redisStatus;
    private String aiServiceStatus;
    private LocalDateTime lastSyncCheck;
    private MemoryUsageDTO memoryUsage;
    private double cpuUsage;
}
