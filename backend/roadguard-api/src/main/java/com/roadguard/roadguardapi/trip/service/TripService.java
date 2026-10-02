package com.roadguard.roadguardapi.trip.service;

import com.roadguard.roadguardapi.common.exception.BadRequestException;
import com.roadguard.roadguardapi.common.exception.ResourceNotFoundException;
import com.roadguard.roadguardapi.trip.dto.EndTripRequest;
import com.roadguard.roadguardapi.trip.dto.StartTripRequest;
import com.roadguard.roadguardapi.trip.dto.TripDTO;
import com.roadguard.roadguardapi.trip.entity.Trip;
import com.roadguard.roadguardapi.trip.entity.TripStatus;
import com.roadguard.roadguardapi.trip.event.TripCompletedEvent;
import com.roadguard.roadguardapi.trip.event.TripStartedEvent;
import com.roadguard.roadguardapi.trip.mapper.TripMapper;
import com.roadguard.roadguardapi.trip.repository.TripRepository;
import com.roadguard.roadguardapi.user.entity.User;
import com.roadguard.roadguardapi.user.repository.UserRepository;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Polygon;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class TripService {

    private static final GeometryFactory GEOMETRY_FACTORY = new GeometryFactory(new PrecisionModel(), 4326);

    private final TripRepository tripRepository;
    private final UserRepository userRepository;
    private final TripMapper tripMapper;
    private final ApplicationEventPublisher eventPublisher;

    public TripService(TripRepository tripRepository,
                       UserRepository userRepository,
                       TripMapper tripMapper,
                       ApplicationEventPublisher eventPublisher) {
        this.tripRepository = tripRepository;
        this.userRepository = userRepository;
        this.tripMapper = tripMapper;
        this.eventPublisher = eventPublisher;
    }

    public TripDTO startTrip(UUID driverId, StartTripRequest request) {
        User driver = userRepository.findById(driverId)
            .orElseThrow(() -> new ResourceNotFoundException("User", "id", driverId));

        tripRepository.findByDriverIdAndStatusAndDeletedAtIsNull(driverId, TripStatus.IN_PROGRESS)
            .ifPresent(t -> {
                throw new BadRequestException("Driver already has an active trip");
            });

        Trip trip = new Trip();
        trip.setDriver(driver);
        trip.setStartPoint(tripMapper.toPoint(request.getStartLat(), request.getStartLng()));
        trip.setEndPoint(tripMapper.toPoint(request.getEndLat(), request.getEndLng()));
        trip.setStartAddress(request.getStartAddress());
        trip.setEndAddress(request.getEndAddress());
        trip.setStatus(TripStatus.PLANNED);
        trip.setStartTime(LocalDateTime.now());
        trip.setRiskScore(0);

        Trip saved = tripRepository.save(trip);

        saved.setStatus(TripStatus.IN_PROGRESS);
        saved = tripRepository.save(saved);

        eventPublisher.publishEvent(new TripStartedEvent(this, saved.getId(), driverId, saved.getStartPoint(), LocalDateTime.now()));

        return tripMapper.toDto(saved);
    }

    public TripDTO endTrip(UUID driverId, EndTripRequest request) {
        Trip trip = tripRepository.findByIdAndDriverId(request.getTripId(), driverId)
            .orElseThrow(() -> new ResourceNotFoundException("Trip", "id", request.getTripId()));

        if (trip.getStatus() != TripStatus.IN_PROGRESS) {
            throw new BadRequestException("Trip is not in progress");
        }

        trip.setEndPoint(tripMapper.toPoint(request.getEndLat(), request.getEndLng()));
        trip.setEndAddress(request.getEndAddress());
        trip.setEndTime(LocalDateTime.now());
        trip.setStatus(TripStatus.COMPLETED);

        if (request.getTotalDistance() != null) {
            trip.setTotalDistance(request.getTotalDistance());
        }
        if (request.getAverageSpeed() != null) {
            trip.setAverageSpeed(request.getAverageSpeed());
        }
        if (request.getMaxSpeed() != null) {
            trip.setMaxSpeed(request.getMaxSpeed());
        }

        if (trip.getStartTime() != null && trip.getEndTime() != null) {
            long durationSeconds = Duration.between(trip.getStartTime(), trip.getEndTime()).getSeconds();
            if (durationSeconds > 0 && trip.getTotalDistance() != null) {
                double speedKmh = (trip.getTotalDistance() / 1000.0) / (durationSeconds / 3600.0);
                if (trip.getAverageSpeed() == null) {
                    trip.setAverageSpeed(Math.round(speedKmh * 100.0) / 100.0);
                }
            }
        }

        Trip saved = tripRepository.save(trip);

        long duration = trip.getStartTime() != null && trip.getEndTime() != null
            ? Duration.between(trip.getStartTime(), trip.getEndTime()).getSeconds()
            : 0L;

        eventPublisher.publishEvent(new TripCompletedEvent(this, saved.getId(), driverId,
            saved.getTotalDistance(), duration, 0, LocalDateTime.now()));

        return tripMapper.toDto(saved);
    }

    @Transactional(readOnly = true)
    public TripDTO getActiveTrip(UUID driverId) {
        Trip trip = tripRepository.findByDriverIdAndStatusAndDeletedAtIsNull(driverId, TripStatus.IN_PROGRESS)
            .orElseThrow(() -> new ResourceNotFoundException("Trip", "driverId", driverId));
        return tripMapper.toDto(trip);
    }

    @Transactional(readOnly = true)
    public Page<TripDTO> getTripHistory(UUID driverId, Pageable pageable) {
        List<Trip> trips = tripRepository.findByDriverIdAndDeletedAtIsNullOrderByCreatedAtDesc(driverId, pageable);
        long total = tripRepository.countByDriverIdAndStatus(driverId, TripStatus.COMPLETED);
        List<TripDTO> dtos = tripMapper.toDtoList(trips);
        return new PageImpl<>(dtos, pageable, total);
    }

    @Transactional(readOnly = true)
    public TripDTO getTripById(UUID id, UUID driverId) {
        Trip trip = tripRepository.findByIdAndDriverId(id, driverId)
            .orElseThrow(() -> new ResourceNotFoundException("Trip", "id", id));
        return tripMapper.toDto(trip);
    }

    @Transactional(readOnly = true)
    public List<TripDTO> getActiveTripsInArea(double swLat, double swLng, double neLat, double neLng) {
        Polygon bounds = GEOMETRY_FACTORY.createPolygon(new Coordinate[]{
            new Coordinate(swLng, swLat),
            new Coordinate(neLng, swLat),
            new Coordinate(neLng, neLat),
            new Coordinate(swLng, neLat),
            new Coordinate(swLng, swLat)
        });
        bounds.setSRID(4326);

        List<Trip> trips = tripRepository.findActiveTripsInArea(bounds);
        return tripMapper.toDtoList(trips);
    }
}
