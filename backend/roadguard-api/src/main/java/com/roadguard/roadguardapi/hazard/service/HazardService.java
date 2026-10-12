package com.roadguard.roadguardapi.hazard.service;

import com.roadguard.roadguardapi.common.exception.BadRequestException;
import com.roadguard.roadguardapi.common.exception.ResourceNotFoundException;
import com.roadguard.roadguardapi.hazard.dto.*;
import com.roadguard.roadguardapi.hazard.entity.*;
import com.roadguard.roadguardapi.hazard.event.HazardReportedEvent;
import com.roadguard.roadguardapi.hazard.event.HazardResolvedEvent;
import com.roadguard.roadguardapi.hazard.event.HazardVerifiedEvent;
import com.roadguard.roadguardapi.hazard.mapper.HazardMapper;
import com.roadguard.roadguardapi.hazard.repository.HazardRepository;
import com.roadguard.roadguardapi.integration.ai.AiDetectionResult;
import com.roadguard.roadguardapi.integration.ai.AiServiceClient;
import com.roadguard.roadguardapi.user.entity.User;
import com.roadguard.roadguardapi.user.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;
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

@Slf4j
@Service
@Transactional
public class HazardService {

    private static final GeometryFactory GEOMETRY_FACTORY = new GeometryFactory(new PrecisionModel(), 4326);

    private final HazardRepository hazardRepository;
    private final UserRepository userRepository;
    private final HazardMapper hazardMapper;
    private final ApplicationEventPublisher eventPublisher;
    private final AiServiceClient aiServiceClient;

    public HazardService(HazardRepository hazardRepository,
                         UserRepository userRepository,
                         HazardMapper hazardMapper,
                         ApplicationEventPublisher eventPublisher,
                         AiServiceClient aiServiceClient) {
        this.hazardRepository = hazardRepository;
        this.userRepository = userRepository;
        this.hazardMapper = hazardMapper;
        this.eventPublisher = eventPublisher;
        this.aiServiceClient = aiServiceClient;
    }

    public HazardDTO reportHazard(UUID userId, ReportHazardRequest request) {
        User reporter = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        Hazard hazard = new Hazard();
        hazard.setHazardType(request.getHazardType());
        hazard.setSeverity(request.getSeverity());
        hazard.setStatus(HazardStatus.REPORTED);
        hazard.setLatitude(request.getLatitude());
        hazard.setLongitude(request.getLongitude());
        hazard.setLocation(createPoint(request.getLatitude(), request.getLongitude()));
        hazard.setDescription(request.getDescription());
        hazard.setAddress(request.getAddress());
        hazard.setReportedBy(reporter);
        hazard.setSource(request.getSource() != null ? request.getSource() : "MANUAL");

        if (request.getImageUrls() != null && !request.getImageUrls().isEmpty()) {
            List<HazardImage> images = new ArrayList<>();
            for (String imageUrl : request.getImageUrls()) {
                HazardImage image = new HazardImage();
                image.setHazard(hazard);
                image.setImageUrl(imageUrl);
                image.setImageType("EVIDENCE");
                image.setUploadedAt(LocalDateTime.now());
                images.add(image);
            }
            hazard.setImages(images);
        }

        if (hazard.getImages() != null && !hazard.getImages().isEmpty()) {
            enrichWithAiDetection(hazard, hazard.getImages().get(0).getImageUrl());
        }

        Hazard saved = hazardRepository.save(hazard);

        eventPublisher.publishEvent(new HazardReportedEvent(
                this, saved.getId(), saved.getHazardType(),
                saved.getSeverity().name(), saved.getLatitude(), saved.getLongitude(),
                userId, LocalDateTime.now()));

        return hazardMapper.toDto(saved);
    }

    private void enrichWithAiDetection(Hazard hazard, String imageUrl) {
        try {
            AiDetectionResult detection = aiServiceClient.detectHazardFromUrl(imageUrl);
            if (detection != null && detection.getHazardType() != null) {
                hazard.setAIDetected(true);
                hazard.setConfidenceScore(detection.getConfidenceScore());
                log.info("AI detection for hazard image {}: type={}, confidence={}",
                        imageUrl, detection.getHazardType(), detection.getConfidenceScore());
            }
        } catch (Exception e) {
            log.warn("AI hazard detection skipped for {}: {}", imageUrl, e.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public HazardDTO getHazardById(UUID id) {
        Hazard hazard = hazardRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Hazard", "id", id));
        return hazardMapper.toDto(hazard);
    }

    @Transactional(readOnly = true)
    public List<HazardDTO> getNearbyHazards(double lat, double lng, double radiusKm) {
        double radiusMeters = radiusKm * 1000.0;
        List<HazardStatus> activeStatuses = List.of(
                HazardStatus.DETECTED, HazardStatus.REPORTED,
                HazardStatus.VERIFIED, HazardStatus.ASSIGNED);
        List<Hazard> hazards = hazardRepository.findNearbyHazards(lat, lng, radiusMeters, activeStatuses);
        return hazardMapper.toDtoList(hazards);
    }

    @Transactional(readOnly = true)
    public List<HazardDTO> getHazardsInBoundingBox(double swLat, double swLng, double neLat, double neLng) {
        List<HazardStatus> activeStatuses = List.of(
                HazardStatus.DETECTED, HazardStatus.REPORTED,
                HazardStatus.VERIFIED, HazardStatus.ASSIGNED);
        List<Hazard> hazards = hazardRepository.findActiveHazardsInBoundingBox(
                swLat, swLng, neLat, neLng, activeStatuses);
        return hazardMapper.toDtoList(hazards);
    }

    public HazardDTO verifyHazard(UUID authorityId, VerifyHazardRequest request) {
        User authority = userRepository.findById(authorityId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", authorityId));

        Hazard hazard = hazardRepository.findById(request.getHazardId())
                .orElseThrow(() -> new ResourceNotFoundException("Hazard", "id", request.getHazardId()));

        if (hazard.getStatus() == HazardStatus.RESOLVED || hazard.getStatus() == HazardStatus.REJECTED) {
            throw new BadRequestException("Cannot verify a resolved or rejected hazard");
        }

        switch (request.getAction()) {
            case VERIFIED -> {
                hazard.setStatus(HazardStatus.VERIFIED);
                hazard.setVerifiedBy(authority);
                hazard.setVerifiedAt(LocalDateTime.now());
                hazard.setVerified(true);
            }
            case REJECTED -> {
                hazard.setStatus(HazardStatus.REJECTED);
                hazard.setVerifiedBy(authority);
                hazard.setVerifiedAt(LocalDateTime.now());
            }
            case FLAGGED -> {
                hazard.setVerifiedBy(authority);
                hazard.setVerifiedAt(LocalDateTime.now());
            }
        }

        Hazard saved = hazardRepository.save(hazard);

        eventPublisher.publishEvent(new HazardVerifiedEvent(
                this, saved.getId(), authorityId,
                request.getAction().name(), LocalDateTime.now()));

        return hazardMapper.toDto(saved);
    }

    public HazardDTO assignHazard(UUID authorityId, AssignHazardRequest request) {
        Hazard hazard = hazardRepository.findById(request.getHazardId())
                .orElseThrow(() -> new ResourceNotFoundException("Hazard", "id", request.getHazardId()));

        if (hazard.getStatus() == HazardStatus.RESOLVED || hazard.getStatus() == HazardStatus.REJECTED) {
            throw new BadRequestException("Cannot assign a resolved or rejected hazard");
        }

        hazard.setStatus(HazardStatus.ASSIGNED);
        hazard.setAssignedAt(LocalDateTime.now());

        Hazard saved = hazardRepository.save(hazard);
        return hazardMapper.toDto(saved);
    }

    public HazardDTO resolveHazard(UUID authorityId, ResolveHazardRequest request) {
        Hazard hazard = hazardRepository.findById(request.getHazardId())
                .orElseThrow(() -> new ResourceNotFoundException("Hazard", "id", request.getHazardId()));

        hazard.setStatus(HazardStatus.RESOLVED);
        hazard.setResolvedAt(LocalDateTime.now());
        hazard.setResolutionNotes(request.getResolutionNotes());

        if (request.getImageUrls() != null && !request.getImageUrls().isEmpty()) {
            List<HazardImage> existingImages = hazard.getImages() != null ? hazard.getImages() : new ArrayList<>();
            for (String imageUrl : request.getImageUrls()) {
                HazardImage image = new HazardImage();
                image.setHazard(hazard);
                image.setImageUrl(imageUrl);
                image.setImageType("AFTER");
                image.setUploadedAt(LocalDateTime.now());
                existingImages.add(image);
            }
            hazard.setImages(existingImages);
        }

        Hazard saved = hazardRepository.save(hazard);

        eventPublisher.publishEvent(new HazardResolvedEvent(
                this, saved.getId(), authorityId, LocalDateTime.now()));

        return hazardMapper.toDto(saved);
    }

    @Transactional(readOnly = true)
    public List<HazardDTO> getActiveHazards() {
        List<HazardStatus> activeStatuses = List.of(
                HazardStatus.DETECTED, HazardStatus.REPORTED,
                HazardStatus.VERIFIED, HazardStatus.ASSIGNED);
        List<Hazard> hazards = hazardRepository.findByStatusInAndDeletedAtIsNull(activeStatuses);
        return hazardMapper.toDtoList(hazards);
    }

    @Transactional(readOnly = true)
    public Page<HazardDTO> getHazardsByStatus(HazardStatus status, Pageable pageable) {
        Page<Hazard> hazards = hazardRepository.findByStatusAndDeletedAtIsNull(status, pageable);
        List<HazardDTO> dtos = hazardMapper.toDtoList(hazards.getContent());
        return new PageImpl<>(dtos, pageable, hazards.getTotalElements());
    }

    @Transactional(readOnly = true)
    public Page<HazardDTO> getAllHazards(Pageable pageable) {
        Page<Hazard> hazards = hazardRepository.findAll(pageable);
        List<HazardDTO> dtos = hazardMapper.toDtoList(hazards.getContent());
        return new PageImpl<>(dtos, pageable, hazards.getTotalElements());
    }

    public HazardDTO autoDetectHazard(HazardType type, HazardSeverity severity,
                                       double latitude, double longitude,
                                       String description, double confidenceScore) {
        Hazard hazard = new Hazard();
        hazard.setHazardType(type);
        hazard.setSeverity(severity);
        hazard.setStatus(HazardStatus.DETECTED);
        hazard.setLatitude(latitude);
        hazard.setLongitude(longitude);
        hazard.setLocation(createPoint(latitude, longitude));
        hazard.setDescription(description);
        hazard.setConfidenceScore(confidenceScore);
        hazard.setAIDetected(true);
        hazard.setSource("AI");
        hazard.setVerified(false);

        Hazard saved = hazardRepository.save(hazard);

        eventPublisher.publishEvent(new HazardReportedEvent(
                this, saved.getId(), saved.getHazardType(),
                saved.getSeverity().name(), saved.getLatitude(), saved.getLongitude(),
                null, LocalDateTime.now()));

        return hazardMapper.toDto(saved);
    }

    private Point createPoint(double lat, double lng) {
        Point point = GEOMETRY_FACTORY.createPoint(new Coordinate(lng, lat));
        point.setSRID(4326);
        return point;
    }
}
