package com.roadguard.roadguardapi.analytics.service;

import com.roadguard.roadguardapi.analytics.dto.DashboardStatsDTO;
import com.roadguard.roadguardapi.analytics.dto.DataPoint;
import com.roadguard.roadguardapi.analytics.dto.RoadDangerStats;
import com.roadguard.roadguardapi.anomaly.repository.AnomalyEventRepository;
import com.roadguard.roadguardapi.hazard.entity.Hazard;
import com.roadguard.roadguardapi.hazard.entity.HazardSeverity;
import com.roadguard.roadguardapi.hazard.entity.HazardStatus;
import com.roadguard.roadguardapi.hazard.entity.HazardType;
import com.roadguard.roadguardapi.hazard.repository.HazardRepository;
import com.roadguard.roadguardapi.trip.entity.Trip;
import com.roadguard.roadguardapi.trip.entity.TripStatus;
import com.roadguard.roadguardapi.trip.repository.TripRepository;
import com.roadguard.roadguardapi.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AnalyticsService {

    private final UserRepository userRepository;
    private final TripRepository tripRepository;
    private final HazardRepository hazardRepository;
    private final AnomalyEventRepository anomalyEventRepository;

    @Cacheable(value = "dashboardStats", key = "'default'", unless = "#result == null")
    public DashboardStatsDTO getDashboardStats() {
        LocalDate today = LocalDate.now();
        LocalDateTime startOfToday = today.atStartOfDay();
        LocalDateTime startOfWeek = today.minusDays(7).atStartOfDay();
        LocalDateTime startOfMonth = today.withDayOfMonth(1).atStartOfDay();

        long totalUsers = userRepository.countByIsActiveTrue();
        long totalTrips = tripRepository.count();
        long activeTrips = tripRepository.countByStatusAndCreatedAtBetween(
                TripStatus.IN_PROGRESS, startOfToday, LocalDateTime.now().plusDays(1));
        long totalHazards = hazardRepository.count();
        long activeHazards = hazardRepository.countByStatusAndCreatedAtBetween(
                HazardStatus.REPORTED, LocalDateTime.MIN, LocalDateTime.now().plusDays(1));
        long resolvedHazards = hazardRepository.countByStatusAndCreatedAtBetween(
                HazardStatus.RESOLVED, LocalDateTime.MIN, LocalDateTime.now().plusDays(1));
        long todayTrips = tripRepository.countByStatusAndCreatedAtBetween(
                TripStatus.COMPLETED, startOfToday, LocalDateTime.now().plusDays(1));
        long todayHazards = hazardRepository.countByStatusAndCreatedAtBetween(
                HazardStatus.REPORTED, startOfToday, LocalDateTime.now().plusDays(1));

        return DashboardStatsDTO.builder()
                .totalUsers(totalUsers)
                .totalTrips(totalTrips)
                .activeTrips(activeTrips)
                .totalHazards(totalHazards)
                .activeHazards(activeHazards)
                .resolvedHazards(resolvedHazards)
                .avgResponseTime(getAverageResponseTime())
                .dailyActiveUsers(getDailyActiveUsers(today))
                .todayTrips(todayTrips)
                .todayHazards(todayHazards)
                .topDangerousRoads(getTopDangerousRoads(10))
                .hazardByType(getHazardByTypeDistribution())
                .hazardBySeverity(getHazardBySeverityDistribution())
                .tripTrend(getTripTrend(startOfWeek.toLocalDate(), today, "DAY"))
                .hazardTrend(getHazardTrend(startOfWeek.toLocalDate(), today, "DAY"))
                .build();
    }

    public long getDailyActiveUsers(LocalDate date) {
        LocalDateTime start = date.atStartOfDay();
        LocalDateTime end = date.atTime(LocalTime.MAX);
        return tripRepository.countByStatusAndCreatedAtBetween(TripStatus.IN_PROGRESS, start, end)
                + tripRepository.countByStatusAndCreatedAtBetween(TripStatus.COMPLETED, start, end);
    }

    public List<DataPoint> getTripTrend(LocalDate startDate, LocalDate endDate, String groupBy) {
        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = endDate.atTime(LocalTime.MAX);
        DateTimeFormatter formatter = getFormatter(groupBy);

        List<DataPoint> trend = new ArrayList<>();
        LocalDate current = startDate;
        while (!current.isAfter(endDate)) {
            LocalDateTime periodStart = current.atStartOfDay();
            LocalDateTime periodEnd = getPeriodEnd(current, groupBy);
            long count = tripRepository.countByStatusAndCreatedAtBetween(
                    TripStatus.COMPLETED, periodStart, periodEnd);
            trend.add(DataPoint.builder()
                    .date(current.format(formatter))
                    .value(count)
                    .label(groupBy)
                    .build());
            current = getNextDate(current, groupBy);
        }
        return trend;
    }

    public List<DataPoint> getHazardTrend(LocalDate startDate, LocalDate endDate, String groupBy) {
        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = endDate.atTime(LocalTime.MAX);
        DateTimeFormatter formatter = getFormatter(groupBy);

        List<DataPoint> trend = new ArrayList<>();
        LocalDate current = startDate;
        while (!current.isAfter(endDate)) {
            LocalDateTime periodStart = current.atStartOfDay();
            LocalDateTime periodEnd = getPeriodEnd(current, groupBy);
            long count = hazardRepository.countByStatusAndCreatedAtBetween(
                    HazardStatus.REPORTED, periodStart, periodEnd);
            trend.add(DataPoint.builder()
                    .date(current.format(formatter))
                    .value(count)
                    .label(groupBy)
                    .build());
            current = getNextDate(current, groupBy);
        }
        return trend;
    }

    public List<RoadDangerStats> getTopDangerousRoads(int limit) {
        List<Hazard> allHazards = hazardRepository.findByDeletedAtIsNullOrderByCreatedAtDesc();
        Map<String, List<Hazard>> byRoad = allHazards.stream()
                .filter(h -> h.getRoadName() != null && !h.getRoadName().isBlank())
                .collect(Collectors.groupingBy(Hazard::getRoadName));

        return byRoad.entrySet().stream()
                .map(entry -> {
                    List<Hazard> hazards = entry.getValue();
                    double avgSeverity = hazards.stream()
                            .mapToDouble(h -> severityToNumeric(h.getSeverity()))
                            .average().orElse(0.0);
                    Hazard first = hazards.get(0);
                    return RoadDangerStats.builder()
                            .roadName(entry.getKey())
                            .hazardCount(hazards.size())
                            .avgSeverity(avgSeverity)
                            .latitude(first.getLatitude())
                            .longitude(first.getLongitude())
                            .build();
                })
                .sorted((a, b) -> Long.compare(b.getHazardCount(), a.getHazardCount()))
                .limit(limit)
                .collect(Collectors.toList());
    }

    public Map<String, Long> getHazardByTypeDistribution() {
        List<Hazard> allHazards = hazardRepository.findByDeletedAtIsNullOrderByCreatedAtDesc();
        return allHazards.stream()
                .filter(h -> h.getDeletedAt() == null)
                .collect(Collectors.groupingBy(
                        h -> h.getHazardType().name(),
                        Collectors.counting()));
    }

    public Map<String, Long> getHazardBySeverityDistribution() {
        List<Hazard> allHazards = hazardRepository.findByDeletedAtIsNullOrderByCreatedAtDesc();
        return allHazards.stream()
                .filter(h -> h.getDeletedAt() == null)
                .collect(Collectors.groupingBy(
                        h -> h.getSeverity().name(),
                        Collectors.counting()));
    }

    public Double getAverageResponseTime() {
        List<Hazard> resolvedHazards = hazardRepository.findByStatusInAndDeletedAtIsNull(
                List.of(HazardStatus.RESOLVED));
        if (resolvedHazards.isEmpty()) return 0.0;
        return resolvedHazards.stream()
                .filter(h -> h.getCreatedAt() != null && h.getResolvedAt() != null)
                .mapToLong(h -> java.time.Duration.between(h.getCreatedAt(), h.getResolvedAt()).toHours())
                .average()
                .orElse(0.0);
    }

    public DashboardStatsDTO getAllStats(com.roadguard.roadguardapi.analytics.dto.AnalyticsQuery query) {
        LocalDate start = query.getStartDate() != null ? query.getStartDate() : LocalDate.now().minusDays(30);
        LocalDate end = query.getEndDate() != null ? query.getEndDate() : LocalDate.now();
        String groupBy = query.getGroupBy() != null ? query.getGroupBy() : "DAY";

        return DashboardStatsDTO.builder()
                .totalUsers(userRepository.countByIsActiveTrue())
                .totalTrips(tripRepository.count())
                .activeTrips(tripRepository.countByStatusAndCreatedAtBetween(
                        TripStatus.IN_PROGRESS, start.atStartOfDay(), end.atTime(LocalTime.MAX)))
                .totalHazards(hazardRepository.count())
                .activeHazards(hazardRepository.countByStatusAndCreatedAtBetween(
                        HazardStatus.REPORTED, start.atStartOfDay(), end.atTime(LocalTime.MAX)))
                .resolvedHazards(hazardRepository.countByStatusAndCreatedAtBetween(
                        HazardStatus.RESOLVED, start.atStartOfDay(), end.atTime(LocalTime.MAX)))
                .avgResponseTime(getAverageResponseTime())
                .dailyActiveUsers(getDailyActiveUsers(LocalDate.now()))
                .todayTrips(tripRepository.countByStatusAndCreatedAtBetween(
                        TripStatus.COMPLETED, LocalDate.now().atStartOfDay(), LocalDateTime.now().plusDays(1)))
                .todayHazards(hazardRepository.countByStatusAndCreatedAtBetween(
                        HazardStatus.REPORTED, LocalDate.now().atStartOfDay(), LocalDateTime.now().plusDays(1)))
                .topDangerousRoads(getTopDangerousRoads(10))
                .hazardByType(getHazardByTypeDistribution())
                .hazardBySeverity(getHazardBySeverityDistribution())
                .tripTrend(getTripTrend(start, end, groupBy))
                .hazardTrend(getHazardTrend(start, end, groupBy))
                .build();
    }

    @CacheEvict(value = "dashboardStats", allEntries = true)
    @Scheduled(fixedRateString = "${analytics.cache.ttl:300000}")
    public void evictDashboardCache() {
        log.debug("Evicting dashboard stats cache");
    }

    private double severityToNumeric(HazardSeverity severity) {
        return switch (severity) {
            case LOW -> 1.0;
            case MEDIUM -> 2.0;
            case HIGH -> 3.0;
            case CRITICAL -> 4.0;
        };
    }

    private DateTimeFormatter getFormatter(String groupBy) {
        return switch (groupBy.toUpperCase()) {
            case "WEEK" -> DateTimeFormatter.ofPattern("yyyy-'W'ww");
            case "MONTH" -> DateTimeFormatter.ofPattern("yyyy-MM");
            default -> DateTimeFormatter.ISO_LOCAL_DATE;
        };
    }

    private LocalDateTime getPeriodEnd(LocalDate date, String groupBy) {
        return switch (groupBy.toUpperCase()) {
            case "WEEK" -> date.plusDays(7).atStartOfDay();
            case "MONTH" -> date.plusMonths(1).atStartOfDay();
            default -> date.plusDays(1).atStartOfDay();
        };
    }

    private LocalDate getNextDate(LocalDate date, String groupBy) {
        return switch (groupBy.toUpperCase()) {
            case "WEEK" -> date.plusWeeks(1);
            case "MONTH" -> date.plusMonths(1);
            default -> date.plusDays(1);
        };
    }
}
