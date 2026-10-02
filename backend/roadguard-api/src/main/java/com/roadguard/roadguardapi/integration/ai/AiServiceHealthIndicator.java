package com.roadguard.roadguardapi.integration.ai;

import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.stereotype.Component;

@Component
public class AiServiceHealthIndicator implements HealthIndicator {

    private final AiServiceClient aiServiceClient;

    public AiServiceHealthIndicator(AiServiceClient aiServiceClient) {
        this.aiServiceClient = aiServiceClient;
    }

    @Override
    public Health health() {
        try {
            boolean healthy = aiServiceClient.healthCheck();
            if (healthy) {
                return Health.up().withDetail("aiService", "reachable").build();
            }
            return Health.down().withDetail("aiService", "unhealthy response").build();
        } catch (Exception e) {
            return Health.down(e).withDetail("aiService", "unreachable").build();
        }
    }
}
