package com.roadguard.roadguardapi.offline.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SyncConflictDTO {
    private String clientId;
    private String entityType;
    private Object serverVersion;
    private Object clientVersion;
    private String resolvedBy;
    private String message;
}
