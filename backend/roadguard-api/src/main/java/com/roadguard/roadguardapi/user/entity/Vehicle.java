package com.roadguard.roadguardapi.user.entity;

import com.roadguard.roadguardapi.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "vehicles")
public class Vehicle extends BaseEntity {

    @Column(name = "plate_number", length = 20)
    private String plateNumber;

    @Column(length = 100)
    private String make;

    @Column(length = 100)
    private String model;

    private Integer year;

    @Column(length = 50)
    private String color;

    @Enumerated(EnumType.STRING)
    @Column(name = "vehicle_type", length = 20)
    private VehicleType vehicleType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "is_default", nullable = false)
    private boolean isDefault = false;

    public enum VehicleType {
        CAR, MOTORCYCLE, TRUCK, BUS, OTHER
    }
}
