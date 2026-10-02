package com.roadguard.roadguardapi.map.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MapAnomalyDTO {
    private UUID id;
    private double latitude;
    private double longitude;
    private String type;
    private String severity;
    private LocalDateTime detectedAt;
    private int count;
}
