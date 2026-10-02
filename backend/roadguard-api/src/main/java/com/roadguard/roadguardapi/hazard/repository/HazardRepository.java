package com.roadguard.roadguardapi.hazard.repository;

import com.roadguard.roadguardapi.hazard.entity.Hazard;
import com.roadguard.roadguardapi.hazard.entity.HazardStatus;
import com.roadguard.roadguardapi.hazard.entity.HazardType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface HazardRepository extends JpaRepository<Hazard, UUID>, JpaSpecificationExecutor<Hazard> {

    List<Hazard> findByStatusInAndDeletedAtIsNull(List<HazardStatus> statuses);

    @Query(value = "SELECT h FROM Hazard h WHERE h.deletedAt IS NULL AND h.status IN :statuses " +
           "AND (h.latitude BETWEEN :lat - (:radiusMeters / 111319.9) AND :lat + (:radiusMeters / 111319.9)) " +
           "AND (h.longitude BETWEEN :lng - (:radiusMeters / (111319.9 * COS(RADIANS(:lat)))) AND :lng + (:radiusMeters / (111319.9 * COS(RADIANS(:lat)))))")
    List<Hazard> findNearbyHazards(@Param("lat") double lat,
                                   @Param("lng") double lng,
                                   @Param("radiusMeters") double radiusMeters,
                                   @Param("statuses") List<HazardStatus> statuses);

    @Query("SELECT COUNT(h) FROM Hazard h WHERE h.status = :status AND h.createdAt BETWEEN :start AND :end AND h.deletedAt IS NULL")
    long countByStatusAndCreatedAtBetween(@Param("status") HazardStatus status,
                                          @Param("start") LocalDateTime start,
                                          @Param("end") LocalDateTime end);

    @Query(value = "SELECT h FROM Hazard h WHERE h.deletedAt IS NULL AND h.status IN :statuses " +
           "AND h.latitude BETWEEN :swLat AND :neLat AND h.longitude BETWEEN :swLng AND :neLng")
    List<Hazard> findActiveHazardsInBoundingBox(@Param("swLat") double swLat,
                                                @Param("swLng") double swLng,
                                                @Param("neLat") double neLat,
                                                @Param("neLng") double neLng,
                                                @Param("statuses") List<HazardStatus> statuses);

    @Query("SELECT h FROM Hazard h WHERE h.hazardType = :type AND h.createdAt > :after AND h.deletedAt IS NULL")
    List<Hazard> findHazardsByTypeAndCreatedAtAfter(@Param("type") HazardType type,
                                                    @Param("after") LocalDateTime after);

    Page<Hazard> findByRegionAndDeletedAtIsNull(String region, Pageable pageable);

    Page<Hazard> findByStatusAndDeletedAtIsNull(HazardStatus status, Pageable pageable);

    List<Hazard> findByDeletedAtIsNullOrderByCreatedAtDesc();
}
