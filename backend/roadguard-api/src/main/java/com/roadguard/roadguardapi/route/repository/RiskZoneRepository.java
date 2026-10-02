package com.roadguard.roadguardapi.route.repository;

import com.roadguard.roadguardapi.route.entity.RiskZone;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface RiskZoneRepository extends JpaRepository<RiskZone, UUID> {

    List<RiskZone> findByIsActiveTrueAndDeletedAtIsNull();

    @Query(value = "SELECT z FROM RiskZone z WHERE z.isActive = true AND z.deletedAt IS NULL " +
           "AND ST_Contains(z.zoneGeometry, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)) = true")
    List<RiskZone> findRiskZonesContainingPoint(@Param("lat") double lat, @Param("lng") double lng);

    @Query(value = "SELECT z FROM RiskZone z WHERE z.isActive = true AND z.deletedAt IS NULL " +
           "AND ST_Intersects(z.zoneGeometry, ST_MakeEnvelope(:swLng, :swLat, :neLng, :neLat, 4326)) = true")
    List<RiskZone> findRiskZonesInBoundingBox(@Param("swLat") double swLat,
                                               @Param("swLng") double swLng,
                                               @Param("neLat") double neLat,
                                               @Param("neLng") double neLng);
}
