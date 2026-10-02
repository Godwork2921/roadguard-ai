package com.roadguard.roadguardapi.notification.repository;

import com.roadguard.roadguardapi.notification.entity.NotificationPreference;
import com.roadguard.roadguardapi.notification.entity.NotificationType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface NotificationPreferenceRepository extends JpaRepository<NotificationPreference, UUID> {

    Optional<NotificationPreference> findByUserIdAndType(UUID userId, NotificationType type);

    List<NotificationPreference> findByUserId(UUID userId);
}
