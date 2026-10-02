package com.roadguard.roadguardapi.route.entity;

import com.roadguard.roadguardapi.common.entity.BaseEntity;
import com.roadguard.roadguardapi.user.entity.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.locationtech.jts.geom.LineString;
import org.locationtech.jts.geom.Point;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "route_analyses", indexes = {
    @Index(name = "idx_route_user_id", columnList = "user_id"),
    @Index(name = "idx_route_status", columnList = "analysis_status"),
    @Index(name = "idx_route_requested_at", columnList = "requested_at")
})
public class RouteAnalysis extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "start_point", columnDefinition = "geometry(Point, 4326)")
    private Point startPoint;

    @Column(name = "end_point", columnDefinition = "geometry(Point, 4326)")
    private Point endPoint;

    @Column(name = "start_address", length = 500)
    private String startAddress;

    @Column(name = "end_address", length = 500)
    private String endAddress;

    @Column(name = "risk_score")
    private Integer riskScore;

    @Column(name = "total_distance")
    private Double totalDistance;

    @Column(name = "estimated_duration")
    private Long estimatedDuration;

    @Column(name = "hazard_count")
    private Integer hazardCount;

    @Column(name = "safe_route", nullable = false)
    private boolean safeRoute;

    @Column(name = "route_geometry", columnDefinition = "geometry(LineString, 4326)")
    private LineString routeGeometry;

    @Column(name = "alternative_routes")
    private Integer alternativeRoutes;

    @Enumerated(EnumType.STRING)
    @Column(name = "analysis_status", nullable = false, length = 20)
    private AnalysisStatus analysisStatus;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "requested_at", nullable = false)
    private LocalDateTime requestedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "cached_response", columnDefinition = "TEXT")
    private String cachedResponse;

    public enum AnalysisStatus {
        PENDING, PROCESSING, COMPLETED, FAILED
    }
}
