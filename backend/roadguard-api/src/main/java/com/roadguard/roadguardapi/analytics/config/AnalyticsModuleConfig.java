package com.roadguard.roadguardapi.analytics.config;

import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

@Configuration
@EnableCaching
@EnableScheduling
@ComponentScan(basePackages = "com.roadguard.roadguardapi.analytics")
public class AnalyticsModuleConfig {
}
