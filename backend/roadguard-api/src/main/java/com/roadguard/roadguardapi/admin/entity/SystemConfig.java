package com.roadguard.roadguardapi.admin.entity;

import com.roadguard.roadguardapi.common.entity.BaseEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "system_config", uniqueConstraints = {
    @UniqueConstraint(name = "uq_system_config_key", columnNames = "config_key")
})
public class SystemConfig extends BaseEntity {

    @NotBlank
    @Column(name = "config_key", nullable = false, unique = true, length = 100)
    private String configKey;

    @NotBlank
    @Column(name = "config_value", nullable = false, length = 2000)
    private String configValue;

    @Column(length = 500)
    private String description;

    @Column(name = "is_encrypted", nullable = false)
    private boolean isEncrypted = false;

    @Column(name = "data_type", length = 20)
    private String dataType = "STRING";
}
