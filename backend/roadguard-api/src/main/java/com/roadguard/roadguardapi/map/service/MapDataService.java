package com.roadguard.roadguardapi.map.service;

import com.roadguard.roadguardapi.anomaly.entity.AnomalyEvent;
import com.roadguard.roadguardapi.anomaly.repository.AnomalyEventRepository;
import com.roadguard.roadguardapi.hazard.entity.Hazard;
import com.roadguard.roadguardapi.hazard.entity.HazardStatus;
import com.roadguard.roadguardapi.hazard.repository.HazardRepository;
import com.roadguard.roadguardapi.map.dto.*;
import com.roadguard.roadguardapi.route.entity.RiskZone;
import com.roadguard.roadguardapi.route.repository.RiskZoneRepository;
import com.roadguard.roadguardapi.trip.entity.Trip;
import com.roadguard.roadguardapi.trip.repository.TripRepository;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Polygon;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class MapDataService {

    private final HazardRepository hazardRepository;
    private final RiskZoneRepository riskZoneRepository;
    private final TripRepository tripRepository;
    private final AnomalyEventRepository anomalyEventRepository;

    public MapDataService(HazardRepository hazardRepository,
                          RiskZoneRepository riskZoneRepository,
                          TripRepository tripRepository,
                          AnomalyEventRepository anomalyEventRepository) {
        this.hazardRepository = hazardRepository;
        this.riskZoneRepository = riskZoneRepository;
        this.tripRepository = tripRepository;
        this.anomalyEventRepository = anomalyEventRepository;
    }

    @Cacheable(value = "mapData", key = "#swLat.toString()+','+#swLng.toString()+','+#neLat.toString()+','+#neLng.toString()")
    public MapDataDTO getMapData(double swLat, double swLng, double neLat, double neLng) {
        List<MapHazardDTO> hazards = getHazardsInBounds(swLat, swLng, neLat, neLng);
        List<MapRiskZoneDTO> riskZones = getRiskZonesInBounds(swLat, swLng, neLat, neLng);
        List<MapActiveTripDTO> activeTrips = getActiveTripsInBounds(swLat, swLng, neLat, neLng);
        List<MapAnomalyDTO> anomalies = getAnomaliesInBounds(swLat, swLng, neLat, neLng);

        return MapDataDTO.builder()
                .hazards(hazards)
                .riskZones(riskZones)
                .activeTrips(activeTrips)
                .anomalies(anomalies)
                .build();
    }

    public List<MapHazardDTO> getHazardsInBounds(double swLat, double swLng, double neLat, double neLng) {
        List<Hazard> hazards = hazardRepository.findActiveHazardsInBoundingBox(
                swLat, swLng, neLat, neLng,
                List.of(HazardStatus.REPORTED, HazardStatus.VERIFIED, HazardStatus.ASSIGNED));

        return hazards.stream()
                .map(h -> MapHazardDTO.builder()
                        .id(h.getId())
                        .type(h.getHazardType().name())
                        .severity(h.getSeverity().name())
                        .latitude(h.getLatitude())
                        .longitude(h.getLongitude())
                        .status(h.getStatus().name())
                        .reportedAt(h.getCreatedAt())
                        .verifiedAt(h.getVerifiedAt())
                        .resolvedAt(h.getResolvedAt())
                        .confidenceScore(h.getConfidenceScore())
                        .build())
                .toList();
    }

    public List<MapRiskZoneDTO> getRiskZonesInBounds(double swLat, double swLng, double neLat, double neLng) {
        List<RiskZone> zones = riskZoneRepository.findRiskZonesInBoundingBox(swLat, swLng, neLat, neLng);

        return zones.stream()
                .map(z -> MapRiskZoneDTO.builder()
                        .id(z.getId())
                        .name(z.getName())
                        .riskLevel(z.getRiskLevel().name())
                        .latitude(z.getCenterLat())
                        .longitude(z.getCenterLng())
                        .radiusMeters(z.getRadiusMeters())
                        .colorCode(z.getColorCode())
                        .build())
                .toList();
    }

    public List<MapActiveTripDTO> getActiveTripsInBounds(double swLat, double swLng, double neLat, double neLng) {
        GeometryFactory gf = new GeometryFactory(new PrecisionModel(), 4326);
        Polygon bounds = gf.createPolygon(new Coordinate[]{
                new Coordinate(swLng, swLat),
                new Coordinate(neLng, swLat),
                new Coordinate(neLng, neLat),
                new Coordinate(swLng, neLat),
                new Coordinate(swLng, swLat)
        });
        List<Trip> trips = tripRepository.findActiveTripsInArea(bounds);

        return trips.stream()
                .map(t -> MapActiveTripDTO.builder()
                        .id(t.getId())
                        .driverId(t.getDriver().getId())
                        .driverName(t.getDriver().getFirstName() + " " + t.getDriver().getLastName())
                        .latitude(t.getStartPoint() != null ? t.getStartPoint().getY() : 0)
                        .longitude(t.getStartPoint() != null ? t.getStartPoint().getX() : 0)
                        .speed(t.getAverageSpeed())
                        .direction(null)
                        .timestamp(t.getStartTime())
                        .build())
                .toList();
    }

    public List<MapAnomalyDTO> getAnomaliesInBounds(double swLat, double swLng, double neLat, double neLng) {
        LocalDateTime since = LocalDateTime.now().minusHours(24);
        List<Object[]> aggregated = anomalyEventRepository.getAggregatedAnomalies(swLat, swLng, neLat, neLng, since);

        return aggregated.stream()
                .map(row -> MapAnomalyDTO.builder()
                        .id(null)
                        .latitude((Double) row[0])
                        .longitude((Double) row[1])
                        .type(((AnomalyEvent.AnomalyType) row[2]).name())
                        .severity(null)
                        .detectedAt(since)
                        .count(((Long) row[3]).intValue())
                        .build())
                .toList();
    }
}
