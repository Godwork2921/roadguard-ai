package com.roadguard.roadguardapi.integration.notification;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.io.FileInputStream;
import java.io.IOException;

@Configuration
@ConfigurationProperties(prefix = "fcm")
public class FcmConfig {

    private static final Logger log = LoggerFactory.getLogger(FcmConfig.class);

    private String serviceAccountKeyPath;
    private String projectId;
    private boolean enabled = false;

    @PostConstruct
    public void initialize() {
        if (!enabled) {
            log.info("FCM is disabled");
            return;
        }

        if (FirebaseApp.getApps().stream().noneMatch(app -> app.getName().equals(FirebaseApp.DEFAULT_APP_NAME))) {
            try {
                FirebaseOptions.Builder optionsBuilder = FirebaseOptions.builder();

                if (serviceAccountKeyPath != null && !serviceAccountKeyPath.isBlank()) {
                    try (FileInputStream serviceAccount = new FileInputStream(serviceAccountKeyPath)) {
                        optionsBuilder.setCredentials(GoogleCredentials.fromStream(serviceAccount));
                    }
                } else {
                    optionsBuilder.setCredentials(GoogleCredentials.getApplicationDefault());
                }

                if (projectId != null) {
                    optionsBuilder.setProjectId(projectId);
                }

                FirebaseApp.initializeApp(optionsBuilder.build());
                log.info("FirebaseApp initialized successfully for project: {}", projectId);
            } catch (IOException e) {
                log.error("Failed to initialize FirebaseApp: {}", e.getMessage());
            }
        }
    }

    public String getServiceAccountKeyPath() { return serviceAccountKeyPath; }
    public void setServiceAccountKeyPath(String serviceAccountKeyPath) { this.serviceAccountKeyPath = serviceAccountKeyPath; }
    public String getProjectId() { return projectId; }
    public void setProjectId(String projectId) { this.projectId = projectId; }
    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }
}
