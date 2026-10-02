package com.roadguard.roadguardapi.auth.repository;

import com.roadguard.roadguardapi.auth.entity.RefreshToken;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, UUID> {

    Optional<RefreshToken> findByToken(String token);

    @Transactional
    void deleteByUserId(UUID userId);
}
