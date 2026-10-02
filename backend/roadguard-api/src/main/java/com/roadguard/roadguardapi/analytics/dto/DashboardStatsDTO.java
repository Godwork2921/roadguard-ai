package com.roadguard.roadguardapi.analytics.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsDTO {
    private long totalUsers;
    private long totalTrips;
    private long activeTrips;
    private long totalHazards;
    private long activeHazards;
    private long resolvedHazards;
    private Double avgResponseTime;
    private long dailyActiveUsers;
    private long todayTrips;
    private long todayHazards;
    private List<RoadDangerStats> topDangerousRoads;
    private Map<String, Long> hazardByType;
    private Map<String, Long> hazardBySeverity;
    private List<DataPoint> tripTrend;
    private List<DataPoint> hazardTrend;
}
