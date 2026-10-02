package com.roadguard.roadguardapi.offline.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class OfflineSyncRequest {
    private List<OfflineTripDTO> trips;
    private List<OfflineLocationDTO> locations;
    private List<OfflineHazardReportDTO> hazardReports;
    private List<OfflineAnomalyDTO> anomalies;
    private String deviceId;
    private LocalDateTime lastSyncTime;
}
