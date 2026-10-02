package com.roadguard.roadguardapi.integration.maps;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class OsrmWaypoint {
    private double latitude;
    private double longitude;
    private String name;
    private double distance;
}
