package com.roadguard.roadguardapi.offline.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OfflineSyncResponse {
    private int syncedTrips;
    private int syncedLocations;
    private int syncedHazards;
    private int syncedAnomalies;
    private List<SyncConflictDTO> conflicts;
    private LocalDateTime serverTime;
    private String syncToken;
}
