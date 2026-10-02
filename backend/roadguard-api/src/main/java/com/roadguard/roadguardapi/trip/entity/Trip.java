package com.roadguard.roadguardapi.trip.entity;

import com.roadguard.roadguardapi.common.entity.BaseEntity;
import com.roadguard.roadguardapi.user.entity.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.locationtech.jts.geom.Point;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "trips", indexes = {
    @Index(name = "idx_trips_driver_id", columnList = "driver_id"),
    @Index(name = "idx_trips_status", columnList = "status")
})
public class Trip extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "driver_id", nullable = false)
    private User driver;

    @Column(name = "start_point", columnDefinition = "geometry(Point, 4326)")
    private Point startPoint;

    @Column(name = "end_point", columnDefinition = "geometry(Point, 4326)")
    private Point endPoint;

    @Column(name = "start_address", length = 500)
    private String startAddress;

    @Column(name = "end_address", length = 500)
    private String endAddress;

    @Column(name = "start_time")
    private LocalDateTime startTime;

    @Column(name = "end_time")
    private LocalDateTime endTime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TripStatus status;

    @Column(name = "risk_score")
    private Integer riskScore;

    @Column(name = "total_distance")
    private Double totalDistance;

    @Column(name = "average_speed")
    private Double averageSpeed;

    @Column(name = "max_speed")
    private Double maxSpeed;

    @Column(name = "is_offline", nullable = false)
    private boolean isOffline = false;

    @Column(name = "is_synced", nullable = false)
    private boolean isSynced = true;
}
