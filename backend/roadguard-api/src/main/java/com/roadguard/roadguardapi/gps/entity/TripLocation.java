package com.roadguard.roadguardapi.gps.entity;

import com.roadguard.roadguardapi.common.entity.BaseEntity;
import com.roadguard.roadguardapi.trip.entity.Trip;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.locationtech.jts.geom.Point;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "trip_locations", indexes = {
    @Index(name = "idx_trip_locations_trip_id", columnList = "trip_id"),
    @Index(name = "idx_trip_locations_timestamp", columnList = "timestamp"),
    @Index(name = "idx_trip_locations_trip_timestamp", columnList = "trip_id, timestamp")
})
public class TripLocation extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trip_id", nullable = false)
    private Trip trip;

    @NotNull
    @Column(nullable = false)
    private double latitude;

    @NotNull
    @Column(nullable = false)
    private double longitude;

    @Column(name = "speed_kmh")
    private Double speed;

    @Column(name = "direction")
    private Double direction;

    @Column(name = "altitude")
    private Double altitude;

    @Column(name = "accuracy")
    private Float accuracy;

    @Column(name = "bearing")
    private Float bearing;

    @NotNull
    @Column(nullable = false)
    private LocalDateTime timestamp;

    @Column(name = "is_offline", nullable = false)
    private boolean isOffline = false;

    @Column(columnDefinition = "geometry(Point, 4326)")
    private Point point;
}
