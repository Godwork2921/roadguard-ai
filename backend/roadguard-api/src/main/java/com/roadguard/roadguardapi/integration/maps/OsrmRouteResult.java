package com.roadguard.roadguardapi.integration.maps;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class OsrmRouteResult {
    private double distance;
    private double duration;
    private String geometry;
    private List<OsrmWaypoint> waypoints;
    private List<OsrmLeg> legs;
}
