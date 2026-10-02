package com.roadguard.roadguardapi.trip.event;

import org.locationtech.jts.geom.Point;
import org.springframework.context.ApplicationEvent;

import java.time.LocalDateTime;
import java.util.UUID;

public class TripStartedEvent extends ApplicationEvent {

    private final UUID tripId;
    private final UUID driverId;
    private final Point startPoint;
    private final LocalDateTime timestamp;

    public TripStartedEvent(Object source, UUID tripId, UUID driverId, Point startPoint, LocalDateTime timestamp) {
        super(source);
        this.tripId = tripId;
        this.driverId = driverId;
        this.startPoint = startPoint;
        this.timestamp = timestamp;
    }

    public UUID getTripId() {
        return tripId;
    }

    public UUID getDriverId() {
        return driverId;
    }

    public Point getStartPoint() {
        return startPoint;
    }

    public LocalDateTime getEventTimestamp() {
        return timestamp;
    }
}
