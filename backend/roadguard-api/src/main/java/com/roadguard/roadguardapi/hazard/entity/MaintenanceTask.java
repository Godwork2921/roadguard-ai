package com.roadguard.roadguardapi.hazard.entity;

import com.roadguard.roadguardapi.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "maintenance_tasks")
public class MaintenanceTask extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hazard_id", nullable = false)
    private Hazard hazard;

    @Column(name = "assigned_to", length = 200)
    private String assignedTo;

    @Column(name = "assigned_by")
    private UUID assignedBy;

    @Column(length = 1000)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private MaintenanceStatus status;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private MaintenancePriority priority;

    @Column(name = "scheduled_date")
    private LocalDate scheduledDate;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(length = 2000)
    private String notes;

    @OneToMany(mappedBy = "maintenanceTask", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<HazardImage> completionPhotos = new ArrayList<>();

    public enum MaintenanceStatus {
        PENDING,
        IN_PROGRESS,
        COMPLETED,
        CANCELLED
    }

    public enum MaintenancePriority {
        LOW,
        MEDIUM,
        HIGH,
        URGENT
    }
}
