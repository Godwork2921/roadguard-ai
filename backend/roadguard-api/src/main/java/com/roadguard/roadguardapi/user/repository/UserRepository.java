package com.roadguard.roadguardapi.user.repository;

import com.roadguard.roadguardapi.user.entity.User;
import com.roadguard.roadguardapi.user.entity.UserRole;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    @Query("SELECT u FROM User u WHERE u.role = :role AND u.isActive = true AND u.deletedAt IS NULL")
    Page<User> findByRoleAndIsActiveTrue(@Param("role") UserRole role, Pageable pageable);

    long countByIsActiveTrue();

    long countByRoleAndIsActiveTrue(UserRole role);

    long countByRole(UserRole role);

    long countByIsActive(boolean isActive);

    Optional<User> findByIdAndDeletedAtIsNull(UUID id);
}
