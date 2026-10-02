package com.roadguard.roadguardapi.user.event;

import com.roadguard.roadguardapi.user.entity.UserRole;
import org.springframework.context.ApplicationEvent;

import java.time.LocalDateTime;
import java.util.UUID;

public class UserCreatedEvent extends ApplicationEvent {

    private final UUID userId;
    private final String email;
    private final UserRole role;
    private final LocalDateTime timestamp;

    public UserCreatedEvent(Object source, UUID userId, String email, UserRole role) {
        super(source);
        this.userId = userId;
        this.email = email;
        this.role = role;
        this.timestamp = LocalDateTime.now();
    }

    public UUID getUserId() {
        return userId;
    }

    public String getEmail() {
        return email;
    }

    public UserRole getRole() {
        return role;
    }

    public LocalDateTime getEventTimestamp() {
        return timestamp;
    }
}
