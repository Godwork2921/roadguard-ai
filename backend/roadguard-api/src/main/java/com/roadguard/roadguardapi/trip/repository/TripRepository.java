package com.roadguard.roadguardapi.trip.repository;

import com.roadguard.roadguardapi.trip.entity.Trip;
import com.roadguard.roadguardapi.trip.entity.TripStatus;
import org.locationtech.jts.geom.Point;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TripRepository extends JpaRepository<Trip, UUID> {

    List<Trip> findByDriverIdAndDeletedAtIsNullOrderByCreatedAtDesc(UUID driverId, Pageable pageable);

    Optional<Trip> findByIdAndDriverId(UUID id, UUID driverId);

    @Query("SELECT t FROM Trip t WHERE t.status = 'IN_PROGRESS' AND t.deletedAt IS NULL " +
           "AND within(t.startPoint, :bounds) = true")
    List<Trip> findActiveTripsInArea(@Param("bounds") org.locationtech.jts.geom.Polygon bounds);

    long countByDriverIdAndStatus(UUID driverId, TripStatus status);

    long countByStatusAndCreatedAtBetween(TripStatus status, LocalDateTime start, LocalDateTime end);

    Optional<Trip> findByDriverIdAndStatusAndDeletedAtIsNull(UUID driverId, TripStatus status);
}
