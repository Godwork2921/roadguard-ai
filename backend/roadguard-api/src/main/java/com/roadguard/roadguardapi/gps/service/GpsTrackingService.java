package com.roadguard.roadguardapi.gps.service;

import com.roadguard.roadguardapi.common.exception.AccessDeniedException;
import com.roadguard.roadguardapi.common.exception.BadRequestException;
import com.roadguard.roadguardapi.common.exception.ResourceNotFoundException;
import com.roadguard.roadguardapi.gps.dto.LocationUpdateRequest;
import com.roadguard.roadguardapi.gps.dto.TripLocationDTO;
import com.roadguard.roadguardapi.gps.entity.TripLocation;
import com.roadguard.roadguardapi.gps.event.LocationUpdatedEvent;
import com.roadguard.roadguardapi.gps.repository.TripLocationRepository;
import com.roadguard.roadguardapi.trip.entity.Trip;
import com.roadguard.roadguardapi.trip.entity.TripStatus;
import com.roadguard.roadguardapi.trip.repository.TripRepository;
import com.roadguard.roadguardapi.user.entity.User;
import com.roadguard.roadguardapi.user.repository.UserRepository;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
@Transactional
public class GpsTrackingService {

    private static final GeometryFactory GEOMETRY_FACTORY = new GeometryFactory(new PrecisionModel(), 4326);
    private static final String LOCATION_CACHE_KEY = "trip:location:";

    private final TripLocationRepository tripLocationRepository;
    private final TripRepository tripRepository;
    private final UserRepository userRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final Optional<RedisTemplate<String, Object>> redisTemplate;

    public GpsTrackingService(TripLocationRepository tripLocationRepository,
                              TripRepository tripRepository,
                              UserRepository userRepository,
                              ApplicationEventPublisher eventPublisher,
                              Optional<RedisTemplate<String, Object>> redisTemplate) {
        this.tripLocationRepository = tripLocationRepository;
        this.tripRepository = tripRepository;
        this.userRepository = userRepository;
        this.eventPublisher = eventPublisher;
        this.redisTemplate = redisTemplate;
    }

    public TripLocationDTO updateLocation(UUID driverId, LocationUpdateRequest request) {
        Trip trip = tripRepository.findByIdAndDriverId(request.getTripId(), driverId)
                .orElseThrow(() -> new ResourceNotFoundException("Trip", "id", request.getTripId()));

        if (trip.getStatus() != TripStatus.IN_PROGRESS) {
            throw new BadRequestException("Trip is not in progress");
        }

        TripLocation location = new TripLocation();
        location.setTrip(trip);
        location.setLatitude(request.getLatitude());
        location.setLongitude(request.getLongitude());
        location.setSpeed(request.getSpeed());
        location.setDirection(request.getDirection());
        location.setAltitude(request.getAltitude());
        location.setAccuracy(request.getAccuracy());
        location.setBearing(request.getBearing());
        location.setTimestamp(request.getTimestamp() != null ? request.getTimestamp() : LocalDateTime.now());
        location.setPoint(createPoint(request.getLatitude(), request.getLongitude()));

        TripLocation saved = tripLocationRepository.save(location);

        String cacheKey = LOCATION_CACHE_KEY + trip.getId();
        redisTemplate.ifPresent(t -> t.opsForValue().set(cacheKey, toDto(saved), 30, TimeUnit.MINUTES));

        eventPublisher.publishEvent(new LocationUpdatedEvent(
                this, trip.getId(), driverId,
                saved.getLatitude(), saved.getLongitude(),
                saved.getSpeed(), saved.getDirection(),
                saved.getTimestamp()));

        return toDto(saved);
    }

    @Transactional(readOnly = true)
    public List<TripLocationDTO> getTripLocations(UUID tripId, UUID userId) {
        verifyTripAccess(tripId, userId);
        return tripLocationRepository.findByTripIdAndDeletedAtIsNullOrderByTimestampAsc(tripId)
                .stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public TripLocationDTO getLatestLocation(UUID tripId) {
        TripLocation location = tripLocationRepository.findFirstByTripIdOrderByTimestampDesc(tripId)
                .orElseThrow(() -> new ResourceNotFoundException("TripLocation", "tripId", tripId));
        return toDto(location);
    }

    @Transactional(readOnly = true)
    public List<TripLocationDTO> getLocationsInTimeRange(UUID tripId, LocalDateTime start, LocalDateTime end) {
        return tripLocationRepository.findByTripIdAndTimestampBetween(tripId, start, end)
                .stream()
                .map(this::toDto)
                .toList();
    }

    private void verifyTripAccess(UUID tripId, UUID userId) {
        User user = userRepository.findByIdAndDeletedAtIsNull(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        switch (user.getRole()) {
            case DRIVER, PASSENGER -> {
                Trip trip = tripRepository.findById(tripId)
                        .orElseThrow(() -> new ResourceNotFoundException("Trip", "id", tripId));
                if (!trip.getDriver().getId().equals(userId)) {
                    throw new AccessDeniedException("User does not have access to this trip's locations");
                }
            }
            case AUTHORITY_OFFICER, ADMINISTRATOR -> {
            }
            default -> throw new AccessDeniedException("Access denied");
        }
    }

    private Point createPoint(double lat, double lng) {
        Point point = GEOMETRY_FACTORY.createPoint(new Coordinate(lng, lat));
        point.setSRID(4326);
        return point;
    }

    private TripLocationDTO toDto(TripLocation tl) {
        return TripLocationDTO.builder()
                .id(tl.getId())
                .tripId(tl.getTrip().getId())
                .latitude(tl.getLatitude())
                .longitude(tl.getLongitude())
                .speed(tl.getSpeed())
                .direction(tl.getDirection())
                .altitude(tl.getAltitude())
                .accuracy(tl.getAccuracy())
                .bearing(tl.getBearing())
                .timestamp(tl.getTimestamp())
                .build();
    }
}
