package com.roadguard.roadguardapi.hazard.entity;

import com.roadguard.roadguardapi.common.entity.BaseEntity;
import com.roadguard.roadguardapi.user.entity.User;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.locationtech.jts.geom.Point;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "hazards", indexes = {
    @Index(name = "idx_hazards_status", columnList = "status"),
    @Index(name = "idx_hazards_severity", columnList = "severity"),
    @Index(name = "idx_hazards_location", columnList = "location"),
    @Index(name = "idx_hazards_reported_by", columnList = "reported_by")
})
public class Hazard extends BaseEntity {

    @Enumerated(EnumType.STRING)
    @Column(name = "hazard_type", nullable = false, length = 30)
    private HazardType hazardType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private HazardSeverity severity;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private HazardStatus status;

    @NotNull
    @Column(nullable = false)
    private double latitude;

    @NotNull
    @Column(nullable = false)
    private double longitude;

    @Column(columnDefinition = "geometry(Point, 4326)")
    private Point location;

    @Size(max = 1000)
    @Column(length = 1000)
    private String description;

    @Column(length = 500)
    private String address;

    @Column(name = "confidence_score")
    private Double confidenceScore;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reported_by")
    private User reportedBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "verified_by")
    private User verifiedBy;

    @Column(name = "verified_at")
    private LocalDateTime verifiedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_to")
    private User assignedTo;

    @Column(name = "assigned_at")
    private LocalDateTime assignedAt;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    @Size(max = 2000)
    @Column(name = "resolution_notes", length = 2000)
    private String resolutionNotes;

    @Column(name = "is_ai_detected", nullable = false)
    private boolean isAIDetected = false;

    @Column(name = "is_verified", nullable = false)
    private boolean isVerified = false;

    @Column(length = 20)
    private String source;

    @Column(length = 100)
    private String region;

    @Column(name = "road_name", length = 200)
    private String roadName;

    @OneToMany(mappedBy = "hazard", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<HazardImage> images = new ArrayList<>();
}
