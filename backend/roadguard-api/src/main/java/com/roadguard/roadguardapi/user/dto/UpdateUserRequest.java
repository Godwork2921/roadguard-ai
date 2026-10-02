package com.roadguard.roadguardapi.user.dto;

import lombok.Data;

@Data
public class UpdateUserRequest {

    private String firstName;
    private String lastName;
    private String phone;
    private String avatarUrl;
    private String vehicleInfo;
    private String region;
}
