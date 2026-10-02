package com.roadguard.roadguardapi.anomaly.config;

import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

@Configuration
@EnableScheduling
@ComponentScan(basePackages = "com.roadguard.roadguardapi.anomaly")
public class AnomalyModuleConfig {
}
