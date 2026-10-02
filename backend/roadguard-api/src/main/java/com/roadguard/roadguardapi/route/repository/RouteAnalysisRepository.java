package com.roadguard.roadguardapi.route.repository;

import com.roadguard.roadguardapi.route.entity.RouteAnalysis;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RouteAnalysisRepository extends JpaRepository<RouteAnalysis, UUID> {

    List<RouteAnalysis> findByUserIdAndDeletedAtIsNullOrderByCreatedAtDesc(UUID userId, Pageable pageable);

    Optional<RouteAnalysis> findByIdAndUserId(UUID id, UUID userId);

    @Query("SELECT r FROM RouteAnalysis r WHERE r.user.id = :userId AND r.createdAt >= :since AND r.deletedAt IS NULL ORDER BY r.createdAt DESC")
    List<RouteAnalysis> findRecentAnalysis(@Param("userId") UUID userId, @Param("since") LocalDateTime since);

    void deleteByUserId(UUID userId);
}
