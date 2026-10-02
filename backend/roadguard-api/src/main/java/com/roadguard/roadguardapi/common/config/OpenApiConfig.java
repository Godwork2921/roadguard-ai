package com.roadguard.roadguardapi.common.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenApiConfig {

    @Value("${server.servlet.context-path:}")
    private String contextPath;

    @Bean
    public OpenAPI roadGuardOpenAPI() {
        Server server = new Server();
        server.setUrl(contextPath.isBlank() ? "/" : contextPath);
        server.setDescription("RoadGuard AI API Server");

        SecurityScheme bearerScheme = new SecurityScheme()
                .type(SecurityScheme.Type.HTTP)
                .scheme("bearer")
                .bearerFormat("JWT")
                .in(SecurityScheme.In.HEADER)
                .name("Authorization");

        SecurityRequirement securityRequirement = new SecurityRequirement()
                .addList("bearer-jwt");

        return new OpenAPI()
                .info(new Info()
                        .title("RoadGuard AI API")
                        .version("1.0.0")
                        .description("REST API for RoadGuard AI - Intelligent Road Safety Platform"))
                .servers(List.of(server))
                .components(new Components()
                        .addSecuritySchemes("bearer-jwt", bearerScheme))
                .addSecurityItem(securityRequirement);
    }
}
