package com.roadguard.roadguardapi.hazard.entity;

import com.roadguard.roadguardapi.common.entity.BaseEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "hazard_images")
public class HazardImage extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hazard_id")
    private Hazard hazard;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "maintenance_task_id")
    private MaintenanceTask maintenanceTask;

    @NotNull
    @Column(name = "image_url", nullable = false, length = 500)
    private String imageUrl;

    @Column(name = "image_type", length = 20)
    private String imageType;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "content_type", length = 100)
    private String contentType;

    @Column(name = "uploaded_at")
    private LocalDateTime uploadedAt;
}
