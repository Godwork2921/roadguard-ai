package com.roadguard.roadguardapi.auth.entity;

import com.roadguard.roadguardapi.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "refresh_tokens", uniqueConstraints = {
    @UniqueConstraint(name = "uk_refresh_token", columnNames = "token")
}, indexes = {
    @Index(name = "idx_refresh_token_token", columnList = "token"),
    @Index(name = "idx_refresh_token_user_id", columnList = "userId")
})
public class RefreshToken extends BaseEntity {

    @Column(nullable = false, length = 512)
    private String token;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(nullable = false)
    private boolean revoked = false;

    @Column(name = "device_info", length = 255)
    private String deviceInfo;

    public boolean isExpired() {
        return LocalDateTime.now().isAfter(expiresAt);
    }
}
