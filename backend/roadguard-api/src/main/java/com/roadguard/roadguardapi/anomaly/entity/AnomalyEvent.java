package com.roadguard.roadguardapi.anomaly.entity;

import com.roadguard.roadguardapi.common.entity.BaseEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.locationtech.jts.geom.Point;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "anomaly_events", indexes = {
    @Index(name = "idx_anomaly_point", columnList = "point"),
    @Index(name = "idx_anomaly_detected_at", columnList = "detected_at"),
    @Index(name = "idx_anomaly_is_verified", columnList = "is_verified"),
    @Index(name = "idx_anomaly_trip_id", columnList = "trip_id"),
    @Index(name = "idx_anomaly_driver_id", columnList = "driver_id")
})
public class AnomalyEvent extends BaseEntity {

    @NotNull
    @Column(nullable = false)
    private double latitude;

    @NotNull
    @Column(nullable = false)
    private double longitude;

    @Column(name = "point", columnDefinition = "geometry(Point, 4326)")
    private Point point;

    @Enumerated(EnumType.STRING)
    @Column(name = "anomaly_type", nullable = false, length = 30)
    private AnomalyType anomalyType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Severity severity;

    private Double speed;

    private Double acceleration;

    private Double heading;

    @Column(name = "driver_id")
    private UUID driverId;

    @Column(name = "trip_id")
    private UUID tripId;

    @Column(name = "device_id", length = 100)
    private String deviceId;

    @Column(name = "confidence_score")
    private Double confidenceScore;

    @Column(name = "is_verified", nullable = false)
    private boolean isVerified = false;

    @Column(name = "is_hazard_created", nullable = false)
    private boolean isHazardCreated = false;

    @Column(name = "weather_condition", length = 100)
    private String weatherCondition;

    @Column(name = "road_condition", length = 100)
    private String roadCondition;

    @Column(columnDefinition = "TEXT")
    private String description;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "raw_sensor_data", columnDefinition = "jsonb")
    private Map<String, Object> rawSensorData;

    @Column(name = "detected_at", nullable = false)
    private LocalDateTime detectedAt;

    public enum AnomalyType {
        SUDDEN_BRAKE, SUDDEN_SWERVE, HARD_ACCELERATION, UNUSUAL_VIBRATION, OFF_ROAD, RAPID_DECELERATION, OTHER
    }

    public enum Severity {
        LOW, MEDIUM, HIGH, CRITICAL
    }
}
