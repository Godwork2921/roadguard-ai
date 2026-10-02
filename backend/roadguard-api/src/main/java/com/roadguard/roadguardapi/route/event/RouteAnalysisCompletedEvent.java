package com.roadguard.roadguardapi.route.event;

import org.springframework.context.ApplicationEvent;

import java.time.LocalDateTime;
import java.util.UUID;

public class RouteAnalysisCompletedEvent extends ApplicationEvent {

    private final UUID analysisId;
    private final UUID userId;
    private final int riskScore;
    private final int hazardCount;
    private final LocalDateTime timestamp;

    public RouteAnalysisCompletedEvent(Object source, UUID analysisId, UUID userId,
                                       int riskScore, int hazardCount, LocalDateTime timestamp) {
        super(source);
        this.analysisId = analysisId;
        this.userId = userId;
        this.riskScore = riskScore;
        this.hazardCount = hazardCount;
        this.timestamp = timestamp;
    }

    public UUID getAnalysisId() { return analysisId; }
    public UUID getUserId() { return userId; }
    public int getRiskScore() { return riskScore; }
    public int getHazardCount() { return hazardCount; }
    public LocalDateTime getEventTimestamp() { return timestamp; }
}
