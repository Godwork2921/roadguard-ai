package com.roadguard.roadguardapi.gps.repository;

import com.roadguard.roadguardapi.gps.entity.TripLocation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TripLocationRepository extends JpaRepository<TripLocation, UUID> {

    List<TripLocation> findByTripIdAndDeletedAtIsNullOrderByTimestampAsc(UUID tripId);

    @Query("SELECT tl FROM TripLocation tl WHERE tl.trip.id = :tripId AND tl.deletedAt IS NULL AND tl.timestamp BETWEEN :start AND :end ORDER BY tl.timestamp ASC")
    List<TripLocation> findByTripIdAndTimestampBetween(
            @Param("tripId") UUID tripId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    Optional<TripLocation> findFirstByTripIdOrderByTimestampDesc(UUID tripId);

    @Modifying
    @Query("DELETE FROM TripLocation tl WHERE tl.trip.id = :tripId")
    void deleteByTripId(@Param("tripId") UUID tripId);

    long countByTripIdAndDeletedAtIsNull(UUID tripId);
}
