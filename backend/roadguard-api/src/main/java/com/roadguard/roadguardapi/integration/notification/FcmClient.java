package com.roadguard.roadguardapi.integration.notification;

import com.google.firebase.messaging.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class FcmClient {

    private static final Logger log = LoggerFactory.getLogger(FcmClient.class);

    private final FcmConfig fcmConfig;

    public FcmClient(FcmConfig fcmConfig) {
        this.fcmConfig = fcmConfig;
    }

    public String sendPushNotification(String fcmToken, String title, String body, Map<String, String> data) {
        if (!fcmConfig.isEnabled()) {
            log.debug("FCM is disabled, skipping push notification");
            return null;
        }

        try {
            Message message = Message.builder()
                    .setToken(fcmToken)
                    .setNotification(Notification.builder()
                            .setTitle(title)
                            .setBody(body)
                            .build())
                    .putAllData(data != null ? data : Map.of())
                    .build();

            String messageId = FirebaseMessaging.getInstance().send(message);
            log.debug("Push notification sent successfully, messageId: {}", messageId);
            return messageId;
        } catch (FirebaseMessagingException e) {
            handleFcmError(e, fcmToken);
            return null;
        }
    }

    public List<String> sendPushToMultiple(List<String> fcmTokens, String title, String body, Map<String, String> data) {
        if (!fcmConfig.isEnabled()) {
            log.debug("FCM is disabled, skipping batch push notification");
            return List.of();
        }

        try {
            MulticastMessage message = MulticastMessage.builder()
                    .addAllTokens(fcmTokens)
                    .setNotification(Notification.builder()
                            .setTitle(title)
                            .setBody(body)
                            .build())
                    .putAllData(data != null ? data : Map.of())
                    .build();

            BatchResponse response = FirebaseMessaging.getInstance().sendEachForMulticast(message);
            log.debug("Batch push sent: success={}, failure={}", response.getSuccessCount(), response.getFailureCount());

            return response.getResponses().stream()
                    .map(r -> r.getMessageId())
                    .toList();
        } catch (FirebaseMessagingException e) {
            log.error("Batch FCM send failed: {}", e.getMessage());
            return List.of();
        }
    }

    public String sendToTopic(String topic, String title, String body) {
        if (!fcmConfig.isEnabled()) {
            log.debug("FCM is disabled, skipping topic notification");
            return null;
        }

        try {
            Message message = Message.builder()
                    .setTopic(topic)
                    .setNotification(Notification.builder()
                            .setTitle(title)
                            .setBody(body)
                            .build())
                    .build();

            String messageId = FirebaseMessaging.getInstance().send(message);
            log.debug("Topic notification sent to {}: messageId={}", topic, messageId);
            return messageId;
        } catch (FirebaseMessagingException e) {
            log.error("FCM topic send failed for topic {}: {}", topic, e.getMessage());
            return null;
        }
    }

    private void handleFcmError(FirebaseMessagingException e, String token) {
        switch (e.getMessagingErrorCode()) {
            case INVALID_ARGUMENT:
                log.warn("Invalid FCM token: {}", token);
                break;
            case UNREGISTERED:
                log.warn("FCM token is unregistered (device removed): {}", token);
                break;
            case SENDER_ID_MISMATCH:
                log.warn("FCM sender ID mismatch for token: {}", token);
                break;
            case THIRD_PARTY_AUTH_ERROR:
                log.error("FCM authentication error, check service account credentials");
                break;
            case QUOTA_EXCEEDED:
                log.warn("FCM quota exceeded, throttling notifications");
                break;
            case UNAVAILABLE:
                log.warn("FCM service temporarily unavailable, should retry");
                break;
            default:
                log.error("FCM send failed: {} ({})", e.getMessage(), e.getMessagingErrorCode());
        }
    }
}
