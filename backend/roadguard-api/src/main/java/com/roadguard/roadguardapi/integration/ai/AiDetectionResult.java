package com.roadguard.roadguardapi.integration.ai;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class AiDetectionResult {
    private String hazardType;
    private double confidenceScore;
    private String severity;
    private BoundingBox boundingBox;
    private long processingTimeMs;
    private List<DetectedObject> detectedObjects;
}
