package com.roadguard.roadguardapi.trip.entity;

import com.roadguard.roadguardapi.common.entity.BaseEntity;
import com.roadguard.roadguardapi.user.entity.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.locationtech.jts.geom.LineString;
import org.locationtech.jts.geom.Point;

@Getter
@Setter
@NoArgsConstructor
@Entity(name = "TripRouteAnalysis")
@Table(name = "trip_route_analyses")
public class RouteAnalysis extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trip_id", nullable = false)
    private Trip trip;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "start_point", columnDefinition = "geometry(Point, 4326)")
    private Point startPoint;

    @Column(name = "end_point", columnDefinition = "geometry(Point, 4326)")
    private Point endPoint;

    @Column(name = "risk_score")
    private Integer riskScore;

    @Column(name = "distance")
    private Double distance;

    @Column(name = "estimated_duration")
    private Long estimatedDuration;

    @Column(name = "hazard_count")
    private Integer hazardCount;

    @Column(name = "is_alternative", nullable = false)
    private boolean isAlternative = false;

    @Column(name = "route_geometry", columnDefinition = "geometry(LineString, 4326)")
    private LineString routeGeometry;

    @Column(name = "analysis_result", columnDefinition = "TEXT")
    private String analysisResult;

    @Enumerated(EnumType.STRING)
    @Column(name = "analysis_status", nullable = false, length = 20)
    private AnalysisStatus analysisStatus;

    public enum AnalysisStatus {
        PENDING, COMPLETED, FAILED
    }
}
