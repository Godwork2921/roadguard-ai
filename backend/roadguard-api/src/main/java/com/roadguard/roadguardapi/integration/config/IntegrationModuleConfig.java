package com.roadguard.roadguardapi.integration.config;

import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;
import org.springframework.retry.annotation.EnableRetry;
import org.springframework.scheduling.annotation.EnableAsync;

@Configuration
@ComponentScan("com.roadguard.roadguardapi.integration")
@EnableRetry
@EnableAsync
public class IntegrationModuleConfig {
}
