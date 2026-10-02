package com.roadguard.roadguardapi.anomaly.repository;

import com.roadguard.roadguardapi.anomaly.entity.AnomalyEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface AnomalyEventRepository extends JpaRepository<AnomalyEvent, UUID> {

    @Query("SELECT a.latitude, a.longitude, a.anomalyType, COUNT(a) as cnt " +
           "FROM AnomalyEvent a " +
           "WHERE a.isVerified = false AND a.isHazardCreated = false AND a.detectedAt > :since " +
           "GROUP BY a.latitude, a.longitude, a.anomalyType " +
           "HAVING COUNT(a) >= :threshold")
    List<Object[]> findPotentialHazards(@Param("since") LocalDateTime since,
                                         @Param("threshold") long threshold);

    List<AnomalyEvent> findByTripIdAndDeletedAtIsNull(UUID tripId);

    @Query("SELECT a FROM AnomalyEvent a WHERE a.deletedAt IS NULL " +
           "AND a.latitude BETWEEN :swLat AND :neLat " +
           "AND a.longitude BETWEEN :swLng AND :neLng " +
           "AND a.detectedAt >= :since " +
           "ORDER BY a.detectedAt DESC")
    List<AnomalyEvent> findAnomaliesInArea(@Param("swLat") double swLat,
                                            @Param("swLng") double swLng,
                                            @Param("neLat") double neLat,
                                            @Param("neLng") double neLng,
                                            @Param("since") LocalDateTime since);

    @Query("SELECT a.latitude, a.longitude, a.anomalyType, COUNT(a), AVG(a.confidenceScore) " +
           "FROM AnomalyEvent a WHERE a.deletedAt IS NULL " +
           "AND a.latitude BETWEEN :swLat AND :neLat " +
           "AND a.longitude BETWEEN :swLng AND :neLng " +
           "AND a.detectedAt >= :since " +
           "GROUP BY a.latitude, a.longitude, a.anomalyType")
    List<Object[]> getAggregatedAnomalies(@Param("swLat") double swLat,
                                           @Param("swLng") double swLng,
                                           @Param("neLat") double neLat,
                                           @Param("neLng") double neLng,
                                           @Param("since") LocalDateTime since);
}
