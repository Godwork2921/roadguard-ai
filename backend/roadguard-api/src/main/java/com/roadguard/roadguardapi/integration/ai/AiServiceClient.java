package com.roadguard.roadguardapi.integration.ai;

import org.springframework.core.ParameterizedTypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Retryable;
import org.springframework.stereotype.Service;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientRequestException;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class AiServiceClient {

    private static final Logger log = LoggerFactory.getLogger(AiServiceClient.class);

    private final WebClient webClient;
    private final ObjectMapper objectMapper;

    public AiServiceClient(WebClient aiServiceWebClient, ObjectMapper objectMapper) {
        this.webClient = aiServiceWebClient;
        this.objectMapper = objectMapper;
    }

    @Retryable(
            retryFor = {ResourceAccessException.class, WebClientRequestException.class},
            maxAttemptsExpression = "#{@aiServiceConfig.maxRetries}",
            backoff = @Backoff(delayExpression = "#{@aiServiceConfig.retryDelayMs}")
    )
    public AiDetectionResult detectHazard(MultipartFile image) {
        log.debug("Sending image {} to AI detection service", image.getOriginalFilename());

        try {
            MultipartBodyBuilder builder = new MultipartBodyBuilder();
            builder.part("file", new ByteArrayResource(image.getBytes()) {
                @Override
                public String getFilename() {
                    return image.getOriginalFilename();
                }
            });

            Map<String, Object> response = webClient.post()
                    .uri("/api/v1/detect")
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(BodyInserters.fromMultipartData(builder.build()))
                    .retrieve()
                    .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                    .block();

            return parseDetectionResult(response);
        } catch (IOException e) {
            log.error("Failed to read image bytes: {}", e.getMessage());
            throw new RuntimeException("Failed to process image", e);
        } catch (WebClientResponseException e) {
            log.error("AI service returned error: status={}, body={}", e.getStatusCode(), e.getResponseBodyAsString());
            throw e;
        } catch (Exception e) {
            log.error("AI service call failed: {}", e.getMessage());
            throw e;
        }
    }

    @Retryable(
            retryFor = {ResourceAccessException.class, WebClientRequestException.class},
            maxAttemptsExpression = "#{@aiServiceConfig.maxRetries}",
            backoff = @Backoff(delayExpression = "#{@aiServiceConfig.retryDelayMs}")
    )
    public AiDetectionResult detectHazardFromUrl(String imageUrl) {
        log.debug("Sending image URL {} to AI detection service", imageUrl);

        try {
            Map<String, String> request = Map.of("image_url", imageUrl);

            Map<String, Object> response = webClient.post()
                    .uri("/api/v1/detect-url")
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(request)
                    .retrieve()
                    .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                    .block();

            return parseDetectionResult(response);
        } catch (Exception e) {
            log.error("AI service URL detection failed: {}", e.getMessage());
            throw e;
        }
    }

    @Retryable(
            retryFor = {ResourceAccessException.class, WebClientRequestException.class},
            maxAttemptsExpression = "#{@aiServiceConfig.maxRetries}",
            backoff = @Backoff(delayExpression = "#{@aiServiceConfig.retryDelayMs}")
    )
    public Map<String, Object> analyzeAnomaly(Map<String, Object> sensorData) {
        log.debug("Sending anomaly analysis request: {}", sensorData);

        try {
            return webClient.post()
                    .uri("/api/v1/anomaly")
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(sensorData)
                    .retrieve()
                    .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                    .block();
        } catch (Exception e) {
            log.error("AI anomaly analysis failed: {}", e.getMessage());
            throw e;
        }
    }

    @Retryable(
            retryFor = {ResourceAccessException.class, WebClientRequestException.class},
            maxAttemptsExpression = "#{@aiServiceConfig.maxRetries}",
            backoff = @Backoff(delayExpression = "#{@aiServiceConfig.retryDelayMs}")
    )
    public List<AiDetectionResult> batchDetect(List<String> imageUrls) {
        log.debug("Sending batch detection for {} images", imageUrls.size());

        try {
            Map<String, List<String>> request = Map.of("image_urls", imageUrls);

            List<Map<String, Object>> responses = webClient.post()
                    .uri("/api/v1/batch-detect")
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(request)
                    .retrieve()
                    .bodyToMono(new ParameterizedTypeReference<List<Map<String, Object>>>() {})
                    .block();

            return Optional.ofNullable(responses).orElse(List.of()).stream()
                    .map(this::parseDetectionResult)
                    .toList();
        } catch (Exception e) {
            log.error("AI batch detection failed: {}", e.getMessage());
            throw e;
        }
    }

    public boolean healthCheck() {
        try {
            Map<String, Object> response = webClient.get()
                    .uri("/api/v1/health")
                    .retrieve()
                    .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                    .block();

            if (response != null && "ok".equals(response.get("status"))) {
                log.debug("AI service health check passed");
                return true;
            }
            log.warn("AI service health check returned unexpected response: {}", response);
            return false;
        } catch (Exception e) {
            log.warn("AI service health check failed: {}", e.getMessage());
            return false;
        }
    }

    @SuppressWarnings("unchecked")
    private AiDetectionResult parseDetectionResult(Map<String, Object> data) {
        if (data == null) return null;

        AiDetectionResult.AiDetectionResultBuilder builder = AiDetectionResult.builder();

        if (data.get("hazard_type") != null) builder.hazardType((String) data.get("hazard_type"));
        if (data.get("confidence_score") != null) builder.confidenceScore(toDouble(data.get("confidence_score")));
        if (data.get("severity") != null) builder.severity((String) data.get("severity"));
        if (data.get("processing_time_ms") != null) builder.processingTimeMs(toLong(data.get("processing_time_ms")));

        if (data.get("bounding_box") instanceof Map<?, ?> bbMap) {
            builder.boundingBox(parseBoundingBox((Map<String, Object>) bbMap));
        }

        if (data.get("detected_objects") instanceof List<?> objects) {
            builder.detectedObjects(((List<Map<String, Object>>) objects).stream()
                    .map(this::parseDetectedObject)
                    .toList());
        }

        return builder.build();
    }

    private BoundingBox parseBoundingBox(Map<String, Object> data) {
        if (data == null) return null;
        return BoundingBox.builder()
                .x(toInt(data.get("x")))
                .y(toInt(data.get("y")))
                .width(toInt(data.get("width")))
                .height(toInt(data.get("height")))
                .build();
    }

    @SuppressWarnings("unchecked")
    private DetectedObject parseDetectedObject(Map<String, Object> data) {
        if (data == null) return null;
        DetectedObject.DetectedObjectBuilder builder = DetectedObject.builder();
        if (data.get("label") != null) builder.label((String) data.get("label"));
        if (data.get("confidence") != null) builder.confidence(toDouble(data.get("confidence")));
        if (data.get("bbox") instanceof Map<?, ?> bboxMap) {
            builder.bbox(parseBoundingBox((Map<String, Object>) bboxMap));
        }
        return builder.build();
    }

    private double toDouble(Object value) {
        if (value instanceof Number n) return n.doubleValue();
        if (value instanceof String s) return Double.parseDouble(s);
        return 0.0;
    }

    private long toLong(Object value) {
        if (value instanceof Number n) return n.longValue();
        if (value instanceof String s) return Long.parseLong(s);
        return 0L;
    }

    private int toInt(Object value) {
        if (value instanceof Number n) return n.intValue();
        if (value instanceof String s) return Integer.parseInt(s);
        return 0;
    }
}
