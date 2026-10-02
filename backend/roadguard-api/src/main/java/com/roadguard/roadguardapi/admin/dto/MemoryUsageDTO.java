package com.roadguard.roadguardapi.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MemoryUsageDTO {
    private long total;
    private long used;
    private long free;
    private long max;
    private double usagePercent;
}
