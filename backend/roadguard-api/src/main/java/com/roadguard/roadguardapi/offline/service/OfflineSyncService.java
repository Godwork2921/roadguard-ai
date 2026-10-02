package com.roadguard.roadguardapi.offline.service;

import com.roadguard.roadguardapi.anomaly.entity.AnomalyEvent;
import com.roadguard.roadguardapi.anomaly.repository.AnomalyEventRepository;
import com.roadguard.roadguardapi.gps.entity.TripLocation;
import com.roadguard.roadguardapi.gps.event.LocationUpdatedEvent;
import com.roadguard.roadguardapi.gps.repository.TripLocationRepository;
import com.roadguard.roadguardapi.hazard.entity.Hazard;
import com.roadguard.roadguardapi.hazard.entity.HazardSeverity;
import com.roadguard.roadguardapi.hazard.entity.HazardStatus;
import com.roadguard.roadguardapi.hazard.entity.HazardType;
import com.roadguard.roadguardapi.hazard.event.HazardReportedEvent;
import com.roadguard.roadguardapi.hazard.repository.HazardRepository;
import com.roadguard.roadguardapi.offline.dto.*;
import com.roadguard.roadguardapi.trip.entity.Trip;
import com.roadguard.roadguardapi.trip.entity.TripStatus;
import com.roadguard.roadguardapi.trip.repository.TripRepository;
import com.roadguard.roadguardapi.user.entity.User;
import com.roadguard.roadguardapi.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Transactional
public class OfflineSyncService {

    private static final Logger log = LoggerFactory.getLogger(OfflineSyncService.class);

    private final TripRepository tripRepository;
    private final TripLocationRepository tripLocationRepository;
    private final HazardRepository hazardRepository;
    private final AnomalyEventRepository anomalyEventRepository;
    private final UserRepository userRepository;
    private final ApplicationEventPublisher eventPublisher;

    private final Map<String, UUID> clientIdCache = new ConcurrentHashMap<>();

    public OfflineSyncService(TripRepository tripRepository,
                              TripLocationRepository tripLocationRepository,
                              HazardRepository hazardRepository,
                              AnomalyEventRepository anomalyEventRepository,
                              UserRepository userRepository,
                              ApplicationEventPublisher eventPublisher) {
        this.tripRepository = tripRepository;
        this.tripLocationRepository = tripLocationRepository;
        this.hazardRepository = hazardRepository;
        this.anomalyEventRepository = anomalyEventRepository;
        this.userRepository = userRepository;
        this.eventPublisher = eventPublisher;
    }

    public OfflineSyncResponse syncData(UUID userId, OfflineSyncRequest request) {
        List<SyncConflictDTO> conflicts = new ArrayList<>();

        int syncedTrips = processOfflineTrips(userId, request.getTrips(), conflicts);
        int syncedLocations = processOfflineLocations(request.getLocations());
        int syncedHazards = processOfflineHazardReports(userId, request.getHazardReports(), conflicts);
        int syncedAnomalies = processOfflineAnomalies(request.getAnomalies());

        return OfflineSyncResponse.builder()
                .syncedTrips(syncedTrips)
                .syncedLocations(syncedLocations)
                .syncedHazards(syncedHazards)
                .syncedAnomalies(syncedAnomalies)
                .conflicts(conflicts)
                .serverTime(LocalDateTime.now())
                .syncToken(UUID.randomUUID().toString())
                .build();
    }

    private int processOfflineTrips(UUID userId, List<OfflineTripDTO> trips, List<SyncConflictDTO> conflicts) {
        if (trips == null || trips.isEmpty()) return 0;

        User driver = userRepository.findById(userId).orElse(null);
        if (driver == null) return 0;

        int count = 0;
        for (OfflineTripDTO dto : trips) {
            if (clientIdCache.containsKey(dto.getClientId())) continue;

            Trip trip = new Trip();
            trip.setDriver(driver);
            trip.setStartAddress(dto.getStartAddress());
            trip.setEndAddress(dto.getEndAddress());
            trip.setStartTime(dto.getStartTime());
            trip.setEndTime(dto.getEndTime());
            trip.setTotalDistance(dto.getTotalDistance());
            trip.setAverageSpeed(dto.getAverageSpeed());
            trip.setMaxSpeed(dto.getMaxSpeed());
            trip.setOffline(true);
            trip.setSynced(false);

            try {
                trip.setStatus(dto.getStatus() != null ? TripStatus.valueOf(dto.getStatus()) : TripStatus.COMPLETED);
            } catch (IllegalArgumentException e) {
                trip.setStatus(TripStatus.COMPLETED);
            }

            trip = tripRepository.save(trip);
            clientIdCache.put(dto.getClientId(), trip.getId());
            count++;
        }
        return count;
    }

    private int processOfflineLocations(List<OfflineLocationDTO> locations) {
        if (locations == null || locations.isEmpty()) return 0;

        List<TripLocation> entities = new ArrayList<>();
        for (OfflineLocationDTO dto : locations) {
            UUID tripId = clientIdCache.get(dto.getTripClientId());
            if (tripId == null) continue;

            Trip trip = tripRepository.getReferenceById(tripId);

            TripLocation location = new TripLocation();
            location.setTrip(trip);
            location.setLatitude(dto.getLatitude());
            location.setLongitude(dto.getLongitude());
            location.setSpeed(dto.getSpeed());
            location.setDirection(dto.getDirection());
            location.setAltitude(dto.getAltitude());
            location.setAccuracy(dto.getAccuracy());
            location.setTimestamp(dto.getTimestamp() != null ? dto.getTimestamp() : LocalDateTime.now());
            location.setOffline(true);

            entities.add(location);

            eventPublisher.publishEvent(new LocationUpdatedEvent(
                    this, tripId, trip.getDriver().getId(),
                    dto.getLatitude(), dto.getLongitude(),
                    dto.getSpeed(), dto.getDirection(),
                    dto.getTimestamp()));
        }

        tripLocationRepository.saveAll(entities);
        return entities.size();
    }

    private int processOfflineHazardReports(UUID userId, List<OfflineHazardReportDTO> reports, List<SyncConflictDTO> conflicts) {
        if (reports == null || reports.isEmpty()) return 0;

        User reporter = userRepository.findById(userId).orElse(null);
        if (reporter == null) return 0;

        int count = 0;
        for (OfflineHazardReportDTO dto : reports) {
            if (clientIdCache.containsKey("hazard:" + dto.getClientId())) continue;

            HazardType hazardType;
            try {
                hazardType = dto.getHazardType() != null ? HazardType.valueOf(dto.getHazardType()) : HazardType.OTHER;
            } catch (IllegalArgumentException e) {
                hazardType = HazardType.OTHER;
            }

            HazardSeverity severity;
            try {
                severity = dto.getSeverity() != null ? HazardSeverity.valueOf(dto.getSeverity()) : HazardSeverity.MEDIUM;
            } catch (IllegalArgumentException e) {
                severity = HazardSeverity.MEDIUM;
            }

            List<Hazard> existing = hazardRepository.findActiveHazardsInBoundingBox(
                    dto.getLatitude() - 0.001, dto.getLongitude() - 0.001,
                    dto.getLatitude() + 0.001, dto.getLongitude() + 0.001,
                    List.of(HazardStatus.REPORTED, HazardStatus.VERIFIED, HazardStatus.ASSIGNED, HazardStatus.FIXED));

            boolean hasResolved = existing.stream().anyMatch(h -> h.getStatus() == HazardStatus.RESOLVED || h.getStatus() == HazardStatus.REJECTED);
            boolean hasActive = existing.stream().anyMatch(h -> h.getStatus() == HazardStatus.REPORTED || h.getStatus() == HazardStatus.VERIFIED || h.getStatus() == HazardStatus.ASSIGNED);

            if (hasResolved && !hasActive) {
                conflicts.add(SyncConflictDTO.builder()
                        .clientId(dto.getClientId())
                        .entityType("HAZARD")
                        .serverVersion("RESOLVED")
                        .clientVersion(dto.getHazardType())
                        .resolvedBy("SERVER_WINS")
                        .message("Hazard already resolved on server; client report ignored")
                        .build());
                continue;
            }

            Hazard hazard = new Hazard();
            hazard.setHazardType(hazardType);
            hazard.setSeverity(severity);
            hazard.setStatus(HazardStatus.REPORTED);
            hazard.setLatitude(dto.getLatitude());
            hazard.setLongitude(dto.getLongitude());
            hazard.setDescription(dto.getDescription());
            hazard.setAddress(dto.getAddress());
            hazard.setReportedBy(reporter);
            hazard.setSource("MANUAL");
            hazard.setAIDetected(false);
            hazard.setVerified(false);

            hazard = hazardRepository.save(hazard);
            clientIdCache.put("hazard:" + dto.getClientId(), hazard.getId());

            eventPublisher.publishEvent(new HazardReportedEvent(
                    this, hazard.getId(), hazardType, severity.name(),
                    dto.getLatitude(), dto.getLongitude(), userId, LocalDateTime.now()));

            count++;
        }
        return count;
    }

    private int processOfflineAnomalies(List<OfflineAnomalyDTO> anomalies) {
        if (anomalies == null || anomalies.isEmpty()) return 0;

        List<AnomalyEvent> entities = new ArrayList<>();
        for (OfflineAnomalyDTO dto : anomalies) {
            AnomalyEvent event = new AnomalyEvent();
            event.setLatitude(dto.getLatitude());
            event.setLongitude(dto.getLongitude());
            event.setSpeed(dto.getSpeed());
            event.setAcceleration(dto.getAcceleration());
            event.setHeading(dto.getHeading());
            event.setRawSensorData(dto.getRawSensorData());
            event.setDetectedAt(dto.getDetectedAt() != null ? dto.getDetectedAt() : LocalDateTime.now());
            event.setVerified(false);
            event.setHazardCreated(false);

            try {
                if (dto.getAnomalyType() != null) {
                    event.setAnomalyType(AnomalyEvent.AnomalyType.valueOf(dto.getAnomalyType()));
                } else {
                    event.setAnomalyType(AnomalyEvent.AnomalyType.OTHER);
                }
            } catch (IllegalArgumentException e) {
                event.setAnomalyType(AnomalyEvent.AnomalyType.OTHER);
            }
            event.setSeverity(AnomalyEvent.Severity.MEDIUM);

            entities.add(event);
        }

        anomalyEventRepository.saveAll(entities);
        return entities.size();
    }

    public Map<String, Object> getSyncStatus(UUID userId) {
        Map<String, Object> status = new HashMap<>();

        long pendingTrips = tripRepository.countByDriverIdAndStatus(userId, TripStatus.IN_PROGRESS);

        tripRepository.findByDriverIdAndDeletedAtIsNullOrderByCreatedAtDesc(
                userId, org.springframework.data.domain.PageRequest.of(0, 1))
                .stream()
                .findFirst()
                .ifPresentOrElse(
                        t -> status.put("lastSyncTime", t.getUpdatedAt()),
                        () -> status.put("lastSyncTime", null));

        status.put("pendingCount", pendingTrips);
        return status;
    }
}
