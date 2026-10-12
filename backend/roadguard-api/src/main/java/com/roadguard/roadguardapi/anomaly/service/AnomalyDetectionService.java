package com.roadguard.roadguardapi.anomaly.service;

import com.roadguard.roadguardapi.anomaly.dto.AnomalyAggregation;
import com.roadguard.roadguardapi.anomaly.dto.AnomalyEventDTO;
import com.roadguard.roadguardapi.anomaly.dto.ReportAnomalyRequest;
import com.roadguard.roadguardapi.anomaly.entity.AnomalyEvent;
import com.roadguard.roadguardapi.anomaly.entity.AnomalyEvent.AnomalyType;
import com.roadguard.roadguardapi.anomaly.entity.AnomalyEvent.Severity;
import com.roadguard.roadguardapi.anomaly.event.PotentialHazardDetectedEvent;
import com.roadguard.roadguardapi.anomaly.repository.AnomalyEventRepository;
import com.roadguard.roadguardapi.integration.ai.AiServiceClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class AnomalyDetectionService {

    private final AnomalyEventRepository anomalyEventRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final AiServiceClient aiServiceClient;

    private static final GeometryFactory GEOMETRY_FACTORY = new GeometryFactory(new PrecisionModel(), 4326);
    private static final long POTENTIAL_HAZARD_THRESHOLD = 3;
    private static final int HAZARD_WINDOW_MINUTES = 15;

    public AnomalyEventDTO reportAnomaly(UUID driverId, ReportAnomalyRequest req) {
        AnomalyEvent event = new AnomalyEvent();
        event.setDriverId(driverId);
        event.setTripId(req.getTripId());
        event.setLatitude(req.getLatitude());
        event.setLongitude(req.getLongitude());
        event.setPoint(createPoint(req.getLatitude(), req.getLongitude()));
        event.setAnomalyType(req.getAnomalyType());
        event.setSeverity(determineSeverity(req));
        event.setSpeed(req.getSpeed());
        event.setAcceleration(req.getAcceleration());
        event.setHeading(req.getHeading());
        event.setDeviceId(req.getDeviceId());
        event.setConfidenceScore(calculateConfidence(req));
        enrichConfidenceWithAi(event, req);
        event.setRawSensorData(req.getRawSensorData());
        event.setDetectedAt(req.getDetectedAt());

        event = anomalyEventRepository.save(event);

        log.info("Anomaly reported: type={}, severity={}, driverId={}, tripId={}",
            event.getAnomalyType(), event.getSeverity(), driverId, req.getTripId());

        return toDTO(event);
    }

    @Scheduled(fixedRate = 300000)
    @Transactional
    public void detectPotentialHazards() {
        log.info("Running scheduled potential hazard detection");

        LocalDateTime since = LocalDateTime.now().minusMinutes(HAZARD_WINDOW_MINUTES);
        List<Object[]> results = anomalyEventRepository.findPotentialHazards(since, POTENTIAL_HAZARD_THRESHOLD);

        for (Object[] row : results) {
            double lat = (Double) row[0];
            double lng = (Double) row[1];
            AnomalyType type = (AnomalyType) row[2];
            long count = (Long) row[3];

            log.info("Potential hazard detected at ({}, {}): {} events of type {}",
                lat, lng, count, type);

            eventPublisher.publishEvent(new PotentialHazardDetectedEvent(
                this, lat, lng, count, type, LocalDateTime.now()
            ));
        }
    }

    @Transactional(readOnly = true)
    public List<AnomalyEventDTO> getAnomaliesByTrip(UUID tripId, UUID userId) {
        return anomalyEventRepository.findByTripIdAndDeletedAtIsNull(tripId)
            .stream()
            .map(this::toDTO)
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AnomalyAggregation> getAnomalyHeatmapData(double swLat, double swLng,
                                                           double neLat, double neLng) {
        LocalDateTime since = LocalDateTime.now().minusHours(24);
        List<Object[]> results = anomalyEventRepository.getAggregatedAnomalies(
            swLat, swLng, neLat, neLng, since
        );

        return results.stream()
            .map(row -> AnomalyAggregation.builder()
                .latitude((Double) row[0])
                .longitude((Double) row[1])
                .anomalyType(((AnomalyType) row[2]).name())
                .count((Long) row[3])
                .avgConfidence(row[4] != null ? ((Number) row[4]).doubleValue() : 0.0)
                .build())
            .collect(Collectors.toList());
    }

    private void enrichConfidenceWithAi(AnomalyEvent event, ReportAnomalyRequest req) {
        if (req.getRawSensorData() == null || req.getRawSensorData().isEmpty()) {
            return;
        }
        try {
            String sessionId = req.getTripId() != null
                    ? req.getTripId().toString()
                    : req.getDeviceId();
            Map<String, Object> aiResult = aiServiceClient.analyzeAnomaly(
                    req.getLatitude(), req.getLongitude(), req.getRawSensorData(),
                    req.getSpeed(), req.getHeading(), sessionId);

            if (aiResult != null && Boolean.TRUE.equals(aiResult.get("is_anomaly"))
                    && aiResult.get("confidence") instanceof Number aiConfidence
                    && event.getConfidenceScore() != null
                    && aiConfidence.doubleValue() > event.getConfidenceScore()) {
                event.setConfidenceScore(aiConfidence.doubleValue());
                log.debug("AI analysis raised anomaly confidence to {} for driver {}", aiConfidence, event.getDriverId());
            }
        } catch (Exception e) {
            log.warn("AI anomaly analysis skipped for driver {}: {}", event.getDriverId(), e.getMessage());
        }
    }

    private Severity determineSeverity(ReportAnomalyRequest req) {
        if (req.getSpeed() != null) {
            if (req.getSpeed() > 80 && (req.getAcceleration() != null && Math.abs(req.getAcceleration()) > 5)) {
                return Severity.CRITICAL;
            }
            if (req.getSpeed() > 50 && (req.getAcceleration() != null && Math.abs(req.getAcceleration()) > 3)) {
                return Severity.HIGH;
            }
        }
        if (req.getAcceleration() != null) {
            double absAccel = Math.abs(req.getAcceleration());
            if (absAccel > 8) return Severity.CRITICAL;
            if (absAccel > 5) return Severity.HIGH;
            if (absAccel > 3) return Severity.MEDIUM;
        }
        return Severity.LOW;
    }

    private double calculateConfidence(ReportAnomalyRequest req) {
        double confidence = 0.7;
        if (req.getSpeed() != null && req.getSpeed() > 0) confidence += 0.1;
        if (req.getAcceleration() != null && Math.abs(req.getAcceleration()) > 2) confidence += 0.1;
        if (req.getRawSensorData() != null && !req.getRawSensorData().isEmpty()) confidence += 0.1;
        return Math.min(confidence, 1.0);
    }

    private Point createPoint(double lat, double lng) {
        return GEOMETRY_FACTORY.createPoint(new Coordinate(lng, lat));
    }

    private AnomalyEventDTO toDTO(AnomalyEvent event) {
        return AnomalyEventDTO.builder()
            .id(event.getId())
            .latitude(event.getLatitude())
            .longitude(event.getLongitude())
            .anomalyType(event.getAnomalyType().name())
            .severity(event.getSeverity().name())
            .speed(event.getSpeed())
            .acceleration(event.getAcceleration())
            .heading(event.getHeading())
            .driverId(event.getDriverId())
            .tripId(event.getTripId())
            .confidenceScore(event.getConfidenceScore())
            .detectedAt(event.getDetectedAt())
            .isVerified(event.isVerified())
            .isHazardCreated(event.isHazardCreated())
            .build();
    }
}
