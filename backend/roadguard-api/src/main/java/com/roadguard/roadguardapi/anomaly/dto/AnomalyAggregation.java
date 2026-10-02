package com.roadguard.roadguardapi.anomaly.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AnomalyAggregation {

    private double latitude;
    private double longitude;
    private long count;
    private String anomalyType;
    private double avgConfidence;
}
