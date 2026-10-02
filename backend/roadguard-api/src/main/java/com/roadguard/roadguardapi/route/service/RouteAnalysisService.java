package com.roadguard.roadguardapi.route.service;

import com.roadguard.roadguardapi.common.exception.ResourceNotFoundException;
import com.roadguard.roadguardapi.hazard.entity.Hazard;
import com.roadguard.roadguardapi.hazard.entity.HazardSeverity;
import com.roadguard.roadguardapi.hazard.entity.HazardStatus;
import com.roadguard.roadguardapi.hazard.repository.HazardRepository;
import com.roadguard.roadguardapi.route.dto.HazardSummary;
import com.roadguard.roadguardapi.route.dto.RouteAnalysisRequest;
import com.roadguard.roadguardapi.route.dto.RouteAnalysisResponse;
import com.roadguard.roadguardapi.route.entity.RiskZone;
import com.roadguard.roadguardapi.route.entity.RouteAnalysis;
import com.roadguard.roadguardapi.route.entity.RouteAnalysis.AnalysisStatus;
import com.roadguard.roadguardapi.route.event.RouteAnalysisCompletedEvent;
import com.roadguard.roadguardapi.route.repository.RouteAnalysisRepository;
import com.roadguard.roadguardapi.route.repository.RiskZoneRepository;
import com.roadguard.roadguardapi.user.entity.User;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.LineString;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class RouteAnalysisService {

    private final RouteAnalysisRepository routeAnalysisRepository;
    private final RiskZoneRepository riskZoneRepository;
    private final HazardRepository hazardRepository;
    private final ApplicationEventPublisher eventPublisher;

    @PersistenceContext
    private EntityManager entityManager;

    private static final GeometryFactory GEOMETRY_FACTORY = new GeometryFactory(new PrecisionModel(), 4326);
    private static final double ROUTE_CORRIDOR_METERS = 500;
    private static final double HAZARD_PROXIMITY_WEIGHT = 0.4;
    private static final double SEVERITY_WEIGHT = 0.35;
    private static final double RISK_ZONE_WEIGHT = 0.25;

    public RouteAnalysisResponse analyzeRoute(UUID userId, RouteAnalysisRequest req) {
        RouteAnalysis analysis = new RouteAnalysis();
        analysis.setUser(entityManager.getReference(User.class, userId));
        analysis.setStartPoint(createPoint(req.getStartLat(), req.getStartLng()));
        analysis.setEndPoint(createPoint(req.getEndLat(), req.getEndLng()));
        analysis.setStartAddress(req.getStartAddress());
        analysis.setEndAddress(req.getEndAddress());
        analysis.setRequestedAt(LocalDateTime.now());
        analysis.setAnalysisStatus(AnalysisStatus.PENDING);
        analysis = routeAnalysisRepository.save(analysis);

        try {
            analysis.setAnalysisStatus(AnalysisStatus.PROCESSING);
            routeAnalysisRepository.save(analysis);

            double distance = calculateDistance(
                req.getStartLat(), req.getStartLng(), req.getEndLat(), req.getEndLng()
            );
            long duration = estimateDuration(distance);

            List<Hazard> nearbyHazards = findHazardsAlongRoute(
                req.getStartLat(), req.getStartLng(), req.getEndLat(), req.getEndLng()
            );

            List<RiskZone> intersectingZones = findRiskZonesAlongRoute(
                req.getStartLat(), req.getStartLng(), req.getEndLat(), req.getEndLng()
            );

            int riskScore = calculateRiskScore(nearbyHazards, intersectingZones);
            String riskLevel = determineRiskLevel(riskScore);
            boolean safeRoute = riskScore < 34;

            List<HazardSummary> hazardSummaries = nearbyHazards.stream()
                .map(h -> HazardSummary.builder()
                    .id(h.getId())
                    .type(h.getHazardType().name())
                    .severity(h.getSeverity().name())
                    .latitude(h.getLatitude())
                    .longitude(h.getLongitude())
                    .distance(calculateDistance(
                        h.getLatitude(), h.getLongitude(),
                        (req.getStartLat() + req.getEndLat()) / 2,
                        (req.getStartLng() + req.getEndLng()) / 2
                    ))
                    .description(h.getDescription())
                    .build())
                .collect(Collectors.toList());

            List<String> warnings = new ArrayList<>();
            if (riskScore >= 34) {
                warnings.add("High risk area detected along route. " + hazardSummaries.size() + " hazards nearby.");
            }
            if (intersectingZones.size() > 0) {
                warnings.add("Route passes through " + intersectingZones.size() + " risk zone(s).");
            }

            LineString routeLine = createLineString(
                req.getStartLat(), req.getStartLng(), req.getEndLat(), req.getEndLng()
            );

            analysis.setRiskScore(riskScore);
            analysis.setTotalDistance(distance);
            analysis.setEstimatedDuration(duration);
            analysis.setHazardCount(nearbyHazards.size());
            analysis.setSafeRoute(safeRoute);
            analysis.setRouteGeometry(routeLine);
            analysis.setAlternativeRoutes(req.isIncludeAlternatives() ? 2 : 0);
            analysis.setAnalysisStatus(AnalysisStatus.COMPLETED);
            analysis.setCompletedAt(LocalDateTime.now());
            routeAnalysisRepository.save(analysis);

            eventPublisher.publishEvent(new RouteAnalysisCompletedEvent(
                this, analysis.getId(), userId, riskScore, hazardSummaries.size(), LocalDateTime.now()
            ));

            return buildResponse(analysis, riskLevel, hazardSummaries, warnings);
        } catch (Exception e) {
            log.error("Route analysis failed for user {}: {}", userId, e.getMessage(), e);
            analysis.setAnalysisStatus(AnalysisStatus.FAILED);
            analysis.setErrorMessage(e.getMessage());
            analysis.setCompletedAt(LocalDateTime.now());
            routeAnalysisRepository.save(analysis);

            return RouteAnalysisResponse.builder()
                .routeId(analysis.getId())
                .riskScore(0)
                .riskLevel("UNKNOWN")
                .safeRoute(true)
                .warnings(List.of("Analysis failed: " + e.getMessage()))
                .build();
        }
    }

    @Transactional(readOnly = true)
    public Page<RouteAnalysisResponse> getRouteAnalysisHistory(UUID userId, Pageable pageable) {
        List<RouteAnalysis> analyses = routeAnalysisRepository
            .findByUserIdAndDeletedAtIsNullOrderByCreatedAtDesc(userId, pageable);
        long total = routeAnalysisRepository.findByUserIdAndDeletedAtIsNullOrderByCreatedAtDesc(
            userId, Pageable.unpaged()).size();

        List<RouteAnalysisResponse> responses = analyses.stream()
            .map(a -> RouteAnalysisResponse.builder()
                .routeId(a.getId())
                .riskScore(a.getRiskScore())
                .riskLevel(a.getRiskScore() != null ? determineRiskLevel(a.getRiskScore()) : null)
                .totalDistance(a.getTotalDistance())
                .estimatedDuration(a.getEstimatedDuration())
                .safeRoute(a.isSafeRoute())
                .hazardCount(a.getHazardCount())
                .build())
            .collect(Collectors.toList());

        return new PageImpl<>(responses, pageable, total);
    }

    @Transactional(readOnly = true)
    public RouteAnalysis getRouteById(UUID id, UUID userId) {
        return routeAnalysisRepository.findByIdAndUserId(id, userId)
            .orElseThrow(() -> new ResourceNotFoundException("Route analysis not found with id: " + id));
    }

    @Transactional(readOnly = true)
    @Cacheable(value = "riskZones", key = "#swLat + '_' + #swLng + '_' + #neLat + '_' + #neLng")
    public List<RiskZone> getRiskZonesInArea(double swLat, double swLng, double neLat, double neLng) {
        return riskZoneRepository.findRiskZonesInBoundingBox(swLat, swLng, neLat, neLng);
    }

    @Transactional(readOnly = true)
    @Cacheable(value = "routeAnalysis", key = "#req.startLat + '_' + #req.startLng + '_' + #req.endLat + '_' + #req.endLng")
    public RouteAnalysisResponse getCachedAnalysis(RouteAnalysisRequest req) {
        return null;
    }

    int calculateRiskScore(List<Hazard> hazards, List<RiskZone> zones) {
        double score = 0;

        double hazardProximityScore = hazards.stream()
            .mapToDouble(h -> {
                double base = switch (h.getSeverity()) {
                    case CRITICAL -> 50;
                    case HIGH -> 30;
                    case MEDIUM -> 15;
                    case LOW -> 5;
                };
                return base;
            })
            .sum();
        hazardProximityScore = Math.min(hazardProximityScore, 100) * HAZARD_PROXIMITY_WEIGHT;

        long severityCount = hazards.stream()
            .filter(h -> h.getSeverity() == HazardSeverity.HIGH || h.getSeverity() == HazardSeverity.CRITICAL)
            .count();
        double severityScore = Math.min(severityCount * 20, 100) * SEVERITY_WEIGHT;

        double zoneScore = zones.stream()
            .mapToDouble(z -> switch (z.getRiskLevel()) {
                case CRITICAL -> 50;
                case HIGH -> 30;
                case MEDIUM -> 15;
                case LOW -> 5;
            })
            .sum();
        zoneScore = Math.min(zoneScore, 100) * RISK_ZONE_WEIGHT;

        score = hazardProximityScore + severityScore + zoneScore;
        return Math.min((int) Math.round(score), 100);
    }

    private String determineRiskLevel(int score) {
        if (score <= 33) return "LOW";
        if (score <= 66) return "MEDIUM";
        return "HIGH";
    }

    private List<Hazard> findHazardsAlongRoute(double startLat, double startLng, double endLat, double endLng) {
        double midLat = (startLat + endLat) / 2;
        double midLng = (startLng + endLng) / 2;
        return hazardRepository.findNearbyHazards(midLat, midLng, ROUTE_CORRIDOR_METERS,
            List.of(HazardStatus.REPORTED, HazardStatus.VERIFIED));
    }

    private List<RiskZone> findRiskZonesAlongRoute(double startLat, double startLng, double endLat, double endLng) {
        double minLat = Math.min(startLat, endLat);
        double maxLat = Math.max(startLat, endLat);
        double minLng = Math.min(startLng, endLng);
        double maxLng = Math.max(startLng, endLng);
        double buffer = 0.05;
        return riskZoneRepository.findRiskZonesInBoundingBox(
            minLat - buffer, minLng - buffer, maxLat + buffer, maxLng + buffer
        );
    }

    private double calculateDistance(double lat1, double lng1, double lat2, double lng2) {
        double R = 6371000;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                 + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                 * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    private long estimateDuration(double distanceMeters) {
        double avgSpeedMps = 13.89;
        return (long) (distanceMeters / avgSpeedMps);
    }

    private Point createPoint(double lat, double lng) {
        return GEOMETRY_FACTORY.createPoint(new Coordinate(lng, lat));
    }

    private LineString createLineString(double startLat, double startLng, double endLat, double endLng) {
        return GEOMETRY_FACTORY.createLineString(new Coordinate[]{
            new Coordinate(startLng, startLat),
            new Coordinate(endLng, endLat)
        });
    }

    private RouteAnalysisResponse buildResponse(RouteAnalysis analysis, String riskLevel,
                                                 List<HazardSummary> hazards, List<String> warnings) {
        long hours = analysis.getEstimatedDuration() != null ? analysis.getEstimatedDuration() / 3600 : 0;
        long minutes = analysis.getEstimatedDuration() != null ? (analysis.getEstimatedDuration() % 3600) / 60 : 0;
        String formatted = String.format("%dh %dm", hours, minutes);

        return RouteAnalysisResponse.builder()
            .routeId(analysis.getId())
            .riskScore(analysis.getRiskScore())
            .riskLevel(riskLevel)
            .totalDistance(analysis.getTotalDistance())
            .estimatedDuration(analysis.getEstimatedDuration())
            .estimatedDurationFormatted(formatted)
            .hazardCount(analysis.getHazardCount())
            .hazards(hazards)
            .safeRoute(analysis.isSafeRoute())
            .routeGeometry(analysis.getRouteGeometry() != null ? analysis.getRouteGeometry().toText() : null)
            .alternativeRoutes(List.of())
            .warnings(warnings)
            .build();
    }
}
