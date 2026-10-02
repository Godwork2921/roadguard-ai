package com.roadguard.roadguardapi.trip.event;

import org.springframework.context.ApplicationEvent;

import java.time.LocalDateTime;
import java.util.UUID;

public class TripCompletedEvent extends ApplicationEvent {

    private final UUID tripId;
    private final UUID driverId;
    private final Double distance;
    private final Long duration;
    private final Integer hazardCount;
    private final LocalDateTime timestamp;

    public TripCompletedEvent(Object source, UUID tripId, UUID driverId,
                              Double distance, Long duration, Integer hazardCount,
                              LocalDateTime timestamp) {
        super(source);
        this.tripId = tripId;
        this.driverId = driverId;
        this.distance = distance;
        this.duration = duration;
        this.hazardCount = hazardCount;
        this.timestamp = timestamp;
    }

    public UUID getTripId() {
        return tripId;
    }

    public UUID getDriverId() {
        return driverId;
    }

    public Double getDistance() {
        return distance;
    }

    public Long getDuration() {
        return duration;
    }

    public Integer getHazardCount() {
        return hazardCount;
    }

    public LocalDateTime getEventTimestamp() {
        return timestamp;
    }
}
