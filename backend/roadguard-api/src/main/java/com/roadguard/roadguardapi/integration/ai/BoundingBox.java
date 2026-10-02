package com.roadguard.roadguardapi.integration.ai;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class BoundingBox {
    private int x;
    private int y;
    private int width;
    private int height;
}
