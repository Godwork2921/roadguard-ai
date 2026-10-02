package com.roadguard.roadguardapi.integration.maps;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class OsrmStep {
    private double distance;
    private double duration;
    private String instruction;
    private int waypointIndex;
}
