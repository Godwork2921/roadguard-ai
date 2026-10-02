package com.roadguard.roadguardapi.hazard.event;

import com.roadguard.roadguardapi.hazard.entity.HazardType;
import org.springframework.context.ApplicationEvent;

import java.time.LocalDateTime;
import java.util.UUID;

public class HazardReportedEvent extends ApplicationEvent {

    private final UUID hazardId;
    private final HazardType hazardType;
    private final String severity;
    private final double latitude;
    private final double longitude;
    private final UUID reportedById;
    private final LocalDateTime timestamp;

    public HazardReportedEvent(Object source, UUID hazardId, HazardType hazardType,
                               String severity, double latitude, double longitude,
                               UUID reportedById, LocalDateTime timestamp) {
        super(source);
        this.hazardId = hazardId;
        this.hazardType = hazardType;
        this.severity = severity;
        this.latitude = latitude;
        this.longitude = longitude;
        this.reportedById = reportedById;
        this.timestamp = timestamp;
    }

    public UUID getHazardId() { return hazardId; }
    public HazardType getHazardType() { return hazardType; }
    public String getSeverity() { return severity; }
    public double getLatitude() { return latitude; }
    public double getLongitude() { return longitude; }
    public UUID getReportedById() { return reportedById; }
    public LocalDateTime getEventTimestamp() { return timestamp; }
}
