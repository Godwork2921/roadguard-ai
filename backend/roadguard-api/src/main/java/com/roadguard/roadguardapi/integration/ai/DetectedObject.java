package com.roadguard.roadguardapi.integration.ai;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class DetectedObject {
    private String label;
    private double confidence;
    private BoundingBox bbox;
}
