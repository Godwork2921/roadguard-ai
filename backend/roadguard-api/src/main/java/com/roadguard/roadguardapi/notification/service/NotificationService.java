package com.roadguard.roadguardapi.notification.service;

import com.roadguard.roadguardapi.anomaly.event.PotentialHazardDetectedEvent;
import com.roadguard.roadguardapi.common.exception.ResourceNotFoundException;
import com.roadguard.roadguardapi.hazard.event.HazardReportedEvent;
import com.roadguard.roadguardapi.hazard.event.HazardResolvedEvent;
import com.roadguard.roadguardapi.hazard.event.HazardVerifiedEvent;
import com.roadguard.roadguardapi.notification.dto.NotificationPreferenceDTO;
import com.roadguard.roadguardapi.notification.dto.UpdateNotificationPreferenceRequest;
import com.roadguard.roadguardapi.notification.entity.*;
import com.roadguard.roadguardapi.notification.mapper.NotificationMapper;
import com.roadguard.roadguardapi.notification.repository.NotificationPreferenceRepository;
import com.roadguard.roadguardapi.notification.repository.NotificationRepository;
import com.roadguard.roadguardapi.route.event.RouteAnalysisCompletedEvent;
import com.roadguard.roadguardapi.user.entity.User;
import com.roadguard.roadguardapi.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final NotificationPreferenceRepository preferenceRepository;
    private final UserRepository userRepository;
    private final NotificationMapper notificationMapper;

    public Notification sendNotification(UUID userId, String title, String message,
                                          NotificationType type, String referenceType,
                                          UUID referenceId, NotificationPriority priority,
                                          NotificationChannel channel, String actionUrl) {
        User user = userRepository.findByIdAndDeletedAtIsNull(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        Notification notification = new Notification();
        notification.setUser(user);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setType(type);
        notification.setReferenceType(referenceType);
        notification.setReferenceId(referenceId);
        notification.setPriority(priority != null ? priority : NotificationPriority.MEDIUM);
        notification.setChannel(channel != null ? channel : NotificationChannel.IN_APP);
        notification.setActionUrl(actionUrl);
        notification.setSentAt(LocalDateTime.now());
        notification.setReadAt(null);

        notification = notificationRepository.save(notification);

        log.info("Notification sent: userId={}, type={}, channel={}", userId, type, notification.getChannel());
        return notification;
    }

    public void sendBulkNotification(List<UUID> userIds, String title, String message,
                                      NotificationType type, String referenceType,
                                      UUID referenceId, NotificationPriority priority,
                                      NotificationChannel channel, String actionUrl) {
        userIds.forEach(userId -> sendNotification(userId, title, message, type,
                referenceType, referenceId, priority, channel, actionUrl));
    }

    @Transactional(readOnly = true)
    public Page<Notification> getNotifications(UUID userId, Pageable pageable) {
        return notificationRepository.findByUserIdAndDeletedAtIsNullOrderByCreatedAtDesc(userId, pageable);
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(UUID userId) {
        return notificationRepository.countByUserIdAndIsReadFalseAndDeletedAtIsNull(userId);
    }

    public void markAsRead(UUID notificationId, UUID userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found with id: " + notificationId));
        if (!notification.getUser().getId().equals(userId)) {
            throw new SecurityException("Notification does not belong to the current user");
        }
        notification.setRead(true);
        notification.setReadAt(LocalDateTime.now());
        notificationRepository.save(notification);
    }

    public void markAllAsRead(UUID userId) {
        notificationRepository.markAllAsRead(userId, LocalDateTime.now());
    }

    @Transactional(readOnly = true)
    public List<NotificationPreference> getPreferences(UUID userId) {
        return preferenceRepository.findByUserId(userId);
    }

    public NotificationPreference updatePreference(UUID userId, UpdateNotificationPreferenceRequest req) {
        NotificationPreference preference = preferenceRepository
                .findByUserIdAndType(userId, req.getType())
                .orElseGet(() -> {
                    User user = userRepository.findByIdAndDeletedAtIsNull(userId)
                            .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
                    NotificationPreference newPref = new NotificationPreference();
                    newPref.setUser(user);
                    newPref.setType(req.getType());
                    return newPref;
                });

        if (req.getEnabled() != null) preference.setEnabled(req.getEnabled());
        if (req.getPushEnabled() != null) preference.setPushEnabled(req.getPushEnabled());
        if (req.getEmailEnabled() != null) preference.setEmailEnabled(req.getEmailEnabled());
        if (req.getSmsEnabled() != null) preference.setSmsEnabled(req.getSmsEnabled());
        preference.setQuietHoursStart(req.getQuietHoursStart());
        preference.setQuietHoursEnd(req.getQuietHoursEnd());

        return preferenceRepository.save(preference);
    }

    public void deleteNotification(UUID id, UUID userId) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found with id: " + id));
        if (!notification.getUser().getId().equals(userId)) {
            throw new SecurityException("Notification does not belong to the current user");
        }
        notification.softDelete();
        notificationRepository.save(notification);
    }

    @EventListener
    public void handleHazardAlert(HazardReportedEvent event) {
        log.info("Handling HazardReportedEvent: hazardId={}, type={}", event.getHazardId(), event.getHazardType());
        List<User> nearbyDrivers = findNearbyUsers(event.getLatitude(), event.getLongitude(), 5000);
        for (User driver : nearbyDrivers) {
            sendNotification(driver.getId(),
                    "New Hazard Reported: " + event.getHazardType(),
                    "A " + event.getSeverity() + " severity " + event.getHazardType() + " has been reported near your location.",
                    NotificationType.HAZARD_ALERT,
                    "HAZARD", event.getHazardId(),
                    NotificationPriority.HIGH,
                    NotificationChannel.PUSH,
                    "/hazards/" + event.getHazardId());
        }
        List<User> authorities = userRepository.findByRoleAndIsActiveTrue(
                com.roadguard.roadguardapi.user.entity.UserRole.AUTHORITY_OFFICER,
                org.springframework.data.domain.Pageable.unpaged()).getContent();
        for (User authority : authorities) {
            sendNotification(authority.getId(),
                    "Hazard Reported: " + event.getHazardType(),
                    "A " + event.getSeverity() + " hazard has been reported and requires verification.",
                    NotificationType.AUTHORITY_ALERT,
                    "HAZARD", event.getHazardId(),
                    NotificationPriority.URGENT,
                    NotificationChannel.IN_APP,
                    "/authority/hazards/" + event.getHazardId());
        }
    }

    @EventListener
    public void handleHazardVerified(HazardVerifiedEvent event) {
        log.info("Handling HazardVerifiedEvent: hazardId={}, action={}", event.getHazardId(), event.getAction());
        sendNotification(event.getVerifiedById(),
                "Hazard Verification " + event.getAction(),
                "The hazard has been " + event.getAction() + " successfully.",
                NotificationType.VERIFICATION_REQUEST,
                "HAZARD", event.getHazardId(),
                NotificationPriority.MEDIUM,
                NotificationChannel.IN_APP,
                "/hazards/" + event.getHazardId());
    }

    @EventListener
    public void handleHazardResolved(HazardResolvedEvent event) {
        log.info("Handling HazardResolvedEvent: hazardId={}", event.getHazardId());
        List<User> affectedUsers = findUsersNearHazard(event.getHazardId());
        for (User user : affectedUsers) {
            sendNotification(user.getId(),
                    "Hazard Resolved",
                    "A previously reported hazard in your area has been resolved.",
                    NotificationType.HAZARD_RESOLVED,
                    "HAZARD", event.getHazardId(),
                    NotificationPriority.LOW,
                    NotificationChannel.IN_APP,
                    "/hazards/" + event.getHazardId());
        }
    }

    @EventListener
    public void handleRouteAnalysis(RouteAnalysisCompletedEvent event) {
        log.info("Handling RouteAnalysisCompletedEvent: analysisId={}", event.getAnalysisId());
        NotificationType type = event.getRiskScore() > 70
                ? NotificationType.ROUTE_ALERT
                : NotificationType.SAFETY_TIP;
        NotificationPriority priority = event.getRiskScore() > 70
                ? NotificationPriority.HIGH
                : NotificationPriority.LOW;
        sendNotification(event.getUserId(),
                "Route Analysis Complete - Risk Score: " + event.getRiskScore(),
                "Your route analysis is complete. " + event.getHazardCount() + " hazards detected along the route.",
                type, "ROUTE", event.getAnalysisId(),
                priority, NotificationChannel.IN_APP,
                "/routes/" + event.getAnalysisId());
    }

    @EventListener
    public void handlePotentialHazard(PotentialHazardDetectedEvent event) {
        log.info("Handling PotentialHazardDetectedEvent: anomalyType={}, count={}",
                event.getAnomalyType(), event.getAnomalyCount());
        List<User> nearbyDrivers = findNearbyUsers(event.getLatitude(), event.getLongitude(), 3000);
        for (User driver : nearbyDrivers) {
            sendNotification(driver.getId(),
                    "Potential Hazard Detected",
                    "Anomalous driving pattern (" + event.getAnomalyType() + ") detected in your area. Please stay cautious.",
                    NotificationType.ANOMALY_DETECTED,
                    "ANOMALY", null,
                    NotificationPriority.MEDIUM,
                    NotificationChannel.PUSH,
                    null);
        }
    }

    private List<User> findNearbyUsers(double lat, double lng, double radiusMeters) {
        return userRepository.findAll().stream()
                .filter(u -> u.getRole() == com.roadguard.roadguardapi.user.entity.UserRole.DRIVER && u.isActive())
                .limit(50)
                .toList();
    }

    private List<User> findUsersNearHazard(UUID hazardId) {
        return userRepository.findAll().stream()
                .filter(User::isActive)
                .limit(20)
                .toList();
    }
}
