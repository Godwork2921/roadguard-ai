package com.roadguard.roadguardapi.integration.ai;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class BoundingBox {
    private double x;
    private double y;
    private double width;
    private double height;
}
