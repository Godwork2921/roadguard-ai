package com.roadguard.roadguardapi.hazard.entity;

import com.roadguard.roadguardapi.common.entity.BaseEntity;
import com.roadguard.roadguardapi.user.entity.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "hazard_verifications")
public class HazardVerification extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hazard_id", nullable = false)
    private Hazard hazard;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "verified_by", nullable = false)
    private User verifiedBy;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private VerificationAction action;

    @Column(length = 1000)
    private String notes;

    @Column(name = "verified_at", nullable = false)
    private LocalDateTime verifiedAt;

    public enum VerificationAction {
        VERIFIED,
        REJECTED,
        FLAGGED
    }
}
