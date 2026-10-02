package com.roadguard.roadguardapi.gps.event;

import org.springframework.context.ApplicationEvent;

import java.time.LocalDateTime;
import java.util.UUID;

public class LocationUpdatedEvent extends ApplicationEvent {

    private final UUID tripId;
    private final UUID driverId;
    private final double latitude;
    private final double longitude;
    private final Double speed;
    private final Double direction;
    private final LocalDateTime timestamp;

    public LocationUpdatedEvent(Object source, UUID tripId, UUID driverId,
                                double latitude, double longitude,
                                Double speed, Double direction,
                                LocalDateTime timestamp) {
        super(source);
        this.tripId = tripId;
        this.driverId = driverId;
        this.latitude = latitude;
        this.longitude = longitude;
        this.speed = speed;
        this.direction = direction;
        this.timestamp = timestamp;
    }

    public UUID getTripId() { return tripId; }
    public UUID getDriverId() { return driverId; }
    public double getLatitude() { return latitude; }
    public double getLongitude() { return longitude; }
    public Double getSpeed() { return speed; }
    public Double getDirection() { return direction; }
    public LocalDateTime getEventTimestamp() { return timestamp; }
}
