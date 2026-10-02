package com.roadguard.roadguardapi.hazard.event;

import org.springframework.context.ApplicationEvent;

import java.time.LocalDateTime;
import java.util.UUID;

public class HazardResolvedEvent extends ApplicationEvent {

    private final UUID hazardId;
    private final UUID resolvedById;
    private final LocalDateTime timestamp;

    public HazardResolvedEvent(Object source, UUID hazardId, UUID resolvedById, LocalDateTime timestamp) {
        super(source);
        this.hazardId = hazardId;
        this.resolvedById = resolvedById;
        this.timestamp = timestamp;
    }

    public UUID getHazardId() { return hazardId; }
    public UUID getResolvedById() { return resolvedById; }
    public LocalDateTime getEventTimestamp() { return timestamp; }
}
