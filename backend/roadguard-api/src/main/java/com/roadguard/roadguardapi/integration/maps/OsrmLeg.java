package com.roadguard.roadguardapi.integration.maps;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class OsrmLeg {
    private double distance;
    private double duration;
    private String summary;
    private List<OsrmStep> steps;
}
