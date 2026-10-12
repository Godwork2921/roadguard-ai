package com.roadguard.roadguardapi.admin.service;

import com.roadguard.roadguardapi.admin.dto.*;
import com.roadguard.roadguardapi.admin.entity.AuditLog;
import com.roadguard.roadguardapi.admin.entity.SystemConfig;
import com.roadguard.roadguardapi.admin.repository.AuditLogRepository;
import com.roadguard.roadguardapi.admin.repository.SystemConfigRepository;
import com.roadguard.roadguardapi.hazard.entity.HazardStatus;
import com.roadguard.roadguardapi.hazard.repository.HazardRepository;
import com.roadguard.roadguardapi.integration.ai.AiServiceClient;
import com.roadguard.roadguardapi.trip.entity.TripStatus;
import com.roadguard.roadguardapi.trip.repository.TripRepository;
import com.roadguard.roadguardapi.user.entity.UserRole;
import com.roadguard.roadguardapi.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.sql.DataSource;
import java.lang.management.ManagementFactory;
import java.lang.management.MemoryMXBean;
import java.lang.management.MemoryUsage;
import java.lang.management.OperatingSystemMXBean;
import java.sql.Connection;
import java.time.LocalDateTime;
import java.util.*;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class AdminService {

    private static final Logger log = LoggerFactory.getLogger(AdminService.class);

    private final UserRepository userRepository;
    private final TripRepository tripRepository;
    private final HazardRepository hazardRepository;
    private final SystemConfigRepository systemConfigRepository;
    private final AuditLogRepository auditLogRepository;
    private final DataSource dataSource;
    private final Optional<RedisTemplate<String, Object>> redisTemplate;
    private final AiServiceClient aiServiceClient;

    public AdminService(UserRepository userRepository,
                        TripRepository tripRepository,
                        HazardRepository hazardRepository,
                        SystemConfigRepository systemConfigRepository,
                        AuditLogRepository auditLogRepository,
                        DataSource dataSource,
                        Optional<RedisTemplate<String, Object>> redisTemplate,
                        AiServiceClient aiServiceClient) {
        this.userRepository = userRepository;
        this.tripRepository = tripRepository;
        this.hazardRepository = hazardRepository;
        this.systemConfigRepository = systemConfigRepository;
        this.auditLogRepository = auditLogRepository;
        this.dataSource = dataSource;
        this.redisTemplate = redisTemplate;
        this.aiServiceClient = aiServiceClient;
    }

    @Transactional(readOnly = true)
    public SystemHealthDTO getSystemHealth() {
        String uptime = formatUptime(ManagementFactory.getRuntimeMXBean().getUptime());
        long activeUsers = userRepository.countByIsActiveTrue();
        long activeTrips = tripRepository.countByStatusAndCreatedAtBetween(
                TripStatus.IN_PROGRESS, LocalDateTime.now().minusDays(1), LocalDateTime.now());
        long pendingHazards = hazardRepository.countByStatusAndCreatedAtBetween(
                HazardStatus.REPORTED, LocalDateTime.now().minusDays(7), LocalDateTime.now());

        String dbStatus = checkDatabase();
        String redisStatus = checkRedis();
        String aiStatus = checkAIService();

        String overallStatus = "UP";
        if ("DOWN".equals(dbStatus)) overallStatus = "DOWN";
        else if ("DOWN".equals(redisStatus) || "DOWN".equals(aiStatus)) overallStatus = "DEGRADED";

        MemoryMXBean memoryBean = ManagementFactory.getMemoryMXBean();
        MemoryUsage heapUsage = memoryBean.getHeapMemoryUsage();

        MemoryUsageDTO memoryUsage = MemoryUsageDTO.builder()
                .total(heapUsage.getCommitted())
                .used(heapUsage.getUsed())
                .free(heapUsage.getCommitted() - heapUsage.getUsed())
                .max(heapUsage.getMax() == -1 ? Runtime.getRuntime().totalMemory() : heapUsage.getMax())
                .usagePercent((double) heapUsage.getUsed() / heapUsage.getCommitted() * 100)
                .build();

        double cpuUsage = 0.0;
        try {
            OperatingSystemMXBean osBean = ManagementFactory.getOperatingSystemMXBean();
            if (osBean instanceof com.sun.management.OperatingSystemMXBean sunOsBean) {
                cpuUsage = sunOsBean.getProcessCpuLoad() * 100;
            }
        } catch (Exception e) {
            cpuUsage = -1;
        }

        return SystemHealthDTO.builder()
                .status(overallStatus)
                .uptime(uptime)
                .activeUsers(activeUsers)
                .activeTrips(activeTrips)
                .pendingHazards(pendingHazards)
                .databaseStatus(dbStatus)
                .redisStatus(redisStatus)
                .aiServiceStatus(aiStatus)
                .lastSyncCheck(LocalDateTime.now())
                .memoryUsage(memoryUsage)
                .cpuUsage(cpuUsage)
                .build();
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getUserManagementStats() {
        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("total", userRepository.count());
        stats.put("active", userRepository.countByIsActiveTrue());
        stats.put("inactive", userRepository.countByIsActive(false));

        for (UserRole role : UserRole.values()) {
            long activeCount = userRepository.countByRoleAndIsActiveTrue(role);
            long totalCount = userRepository.countByRole(role);
            Map<String, Long> roleStats = new LinkedHashMap<>();
            roleStats.put("total", totalCount);
            roleStats.put("active", activeCount);
            stats.put(role.name().toLowerCase(), roleStats);
        }

        return stats;
    }

    @Transactional(readOnly = true)
    public List<SystemConfigDTO> getConfigs() {
        return systemConfigRepository.findAllByOrderByConfigKeyAsc()
                .stream()
                .map(this::toConfigDTO)
                .collect(Collectors.toList());
    }

    public SystemConfigDTO updateConfig(UUID adminId, UpdateSystemConfigRequest request) {
        SystemConfig config = systemConfigRepository.findByConfigKey(request.getKey())
                .orElseGet(() -> {
                    SystemConfig newConfig = new SystemConfig();
                    newConfig.setConfigKey(request.getKey());
                    return newConfig;
                });

        config.setConfigValue(request.getValue());
        config.setUpdatedBy(adminId);
        config = systemConfigRepository.save(config);

        logAudit(adminId, null, "UPDATE_CONFIG", "SYSTEM_CONFIG",
                config.getId(), "Updated config key=" + request.getKey(), null);

        return toConfigDTO(config);
    }

    @Transactional(readOnly = true)
    public Page<AuditLogEntryDTO> getAuditLogs(Pageable pageable, UUID userId,
                                                String entityType, UUID entityId) {
        Page<AuditLog> logs;

        if (userId != null) {
            logs = auditLogRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
        } else if (entityType != null && entityId != null) {
            logs = auditLogRepository.findByEntityTypeAndEntityIdOrderByCreatedAtDesc(
                    entityType, entityId, pageable);
        } else {
            logs = auditLogRepository.findAllByOrderByCreatedAtDesc(pageable);
        }

        return logs.map(this::toAuditLogEntryDTO);
    }

    public void logAudit(UUID userId, String userEmail, String action, String entityType,
                         UUID entityId, String details, String ipAddress) {
        try {
            AuditLog logEntry = new AuditLog();
            logEntry.setUserId(userId);
            logEntry.setUserEmail(userEmail);
            logEntry.setAction(action);
            logEntry.setEntityType(entityType);
            logEntry.setEntityId(entityId);
            logEntry.setDetails(details != null && details.length() > 2000
                    ? details.substring(0, 2000) : details);
            logEntry.setIpAddress(ipAddress);
            auditLogRepository.save(logEntry);
        } catch (Exception e) {
            log.error("Failed to create audit log: {}", e.getMessage());
        }
    }

    private String checkDatabase() {
        try (Connection conn = dataSource.getConnection()) {
            if (conn.isValid(3)) return "UP";
            return "DEGRADED";
        } catch (Exception e) {
            return "DOWN";
        }
    }

    private String checkRedis() {
        try {
            if (redisTemplate.isPresent()) {
                redisTemplate.get().getConnectionFactory().getConnection().ping();
                return "UP";
            }
            return "DOWN (Redis not configured)";
        } catch (Exception e) {
            return "DOWN";
        }
    }

    private String checkAIService() {
        return aiServiceClient.healthCheck() ? "UP" : "DOWN";
    }

    private String formatUptime(long uptimeMillis) {
        long seconds = uptimeMillis / 1000;
        long days = seconds / 86400;
        long hours = (seconds % 86400) / 3600;
        long minutes = (seconds % 3600) / 60;
        long secs = seconds % 60;

        StringBuilder sb = new StringBuilder();
        if (days > 0) sb.append(days).append("d ");
        if (hours > 0) sb.append(hours).append("h ");
        if (minutes > 0) sb.append(minutes).append("m ");
        sb.append(secs).append("s");
        return sb.toString().trim();
    }

    private SystemConfigDTO toConfigDTO(SystemConfig config) {
        return SystemConfigDTO.builder()
                .id(config.getId())
                .key(config.getConfigKey())
                .value(config.getConfigValue())
                .description(config.getDescription())
                .updatedBy(config.getUpdatedBy() != null ? config.getUpdatedBy().toString() : null)
                .updatedAt(config.getUpdatedAt())
                .build();
    }

    private AuditLogEntryDTO toAuditLogEntryDTO(AuditLog log) {
        return AuditLogEntryDTO.builder()
                .id(log.getId())
                .userId(log.getUserId())
                .userEmail(log.getUserEmail())
                .action(log.getAction())
                .entityType(log.getEntityType())
                .entityId(log.getEntityId())
                .details(log.getDetails())
                .ipAddress(log.getIpAddress())
                .timestamp(log.getCreatedAt())
                .build();
    }
}
