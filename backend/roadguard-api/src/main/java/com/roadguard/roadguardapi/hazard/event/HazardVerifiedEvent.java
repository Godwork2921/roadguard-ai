package com.roadguard.roadguardapi.hazard.event;

import org.springframework.context.ApplicationEvent;

import java.time.LocalDateTime;
import java.util.UUID;

public class HazardVerifiedEvent extends ApplicationEvent {

    private final UUID hazardId;
    private final UUID verifiedById;
    private final String action;
    private final LocalDateTime timestamp;

    public HazardVerifiedEvent(Object source, UUID hazardId, UUID verifiedById,
                               String action, LocalDateTime timestamp) {
        super(source);
        this.hazardId = hazardId;
        this.verifiedById = verifiedById;
        this.action = action;
        this.timestamp = timestamp;
    }

    public UUID getHazardId() { return hazardId; }
    public UUID getVerifiedById() { return verifiedById; }
    public String getAction() { return action; }
    public LocalDateTime getEventTimestamp() { return timestamp; }
}
