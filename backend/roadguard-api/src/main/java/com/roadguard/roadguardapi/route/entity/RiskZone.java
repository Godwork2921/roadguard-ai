package com.roadguard.roadguardapi.route.entity;

import com.roadguard.roadguardapi.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.locationtech.jts.geom.Polygon;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "risk_zones", indexes = {
    @Index(name = "idx_risk_zones_active", columnList = "is_active"),
    @Index(name = "idx_risk_zones_region", columnList = "region"),
    @Index(name = "idx_risk_zones_risk_level", columnList = "risk_level")
})
public class RiskZone extends BaseEntity {

    @Column(nullable = false, length = 200)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "center_lat", nullable = false)
    private double centerLat;

    @Column(name = "center_lng", nullable = false)
    private double centerLng;

    @Column(name = "radius_meters", nullable = false)
    private double radiusMeters;

    @Enumerated(EnumType.STRING)
    @Column(name = "risk_level", nullable = false, length = 20)
    private RiskLevel riskLevel;

    @Column(name = "zone_geometry", columnDefinition = "geometry(Polygon, 4326)")
    private Polygon zoneGeometry;

    @Column(name = "hazard_count")
    private Integer hazardCount;

    @Column(name = "incident_count")
    private Integer incidentCount;

    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;

    @Column(length = 100)
    private String region;

    @Column(name = "last_incident_at")
    private LocalDateTime lastIncidentAt;

    @Column(name = "color_code", length = 7)
    private String colorCode;

    public enum RiskLevel {
        LOW, MEDIUM, HIGH, CRITICAL
    }
}
