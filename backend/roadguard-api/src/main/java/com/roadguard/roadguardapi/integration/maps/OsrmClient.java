package com.roadguard.roadguardapi.integration.maps;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class OsrmClient {

    private static final Logger log = LoggerFactory.getLogger(OsrmClient.class);

    private final RestTemplate osrmRestTemplate;
    private final ObjectMapper objectMapper;

    public OsrmClient(RestTemplate osrmRestTemplate, ObjectMapper objectMapper) {
        this.osrmRestTemplate = osrmRestTemplate;
        this.objectMapper = objectMapper;
    }

    public OsrmRouteResult getRoute(double startLat, double startLng, double endLat, double endLng) {
        String url = String.format(
                "/route/v1/driving/%f,%f;%f,%f?overview=full&geometries=geojson&steps=true",
                startLng, startLat, endLng, endLat
        );

        log.debug("Fetching route from OSRM: {}", url);

        try {
            String jsonResponse = osrmRestTemplate.getForObject(url, String.class);
            return parseRouteResponse(jsonResponse);
        } catch (ResourceAccessException e) {
            log.warn("OSRM service unreachable, returning null route: {}", e.getMessage());
            return null;
        } catch (Exception e) {
            log.error("Failed to fetch route from OSRM: {}", e.getMessage());
            return null;
        }
    }

    public OsrmRouteResult parseRouteResponse(String jsonResponse) {
        if (jsonResponse == null) return null;

        try {
            JsonNode root = objectMapper.readTree(jsonResponse);

            if (!"Ok".equals(root.path("code").asText())) {
                log.warn("OSRM returned non-OK code: {}", root.path("code").asText());
                return null;
            }

            JsonNode route = root.path("routes").get(0);
            if (route == null) return null;

            double distance = route.path("distance").asDouble();
            double duration = route.path("duration").asDouble();
            String geometry = route.path("geometry").toString();

            List<OsrmWaypoint> waypoints = new ArrayList<>();
            for (JsonNode wp : root.path("waypoints")) {
                waypoints.add(OsrmWaypoint.builder()
                        .latitude(wp.path("location").get(1).asDouble())
                        .longitude(wp.path("location").get(0).asDouble())
                        .name(wp.path("name").asText())
                        .distance(wp.path("distance").asDouble())
                        .build());
            }

            List<OsrmLeg> legs = new ArrayList<>();
            for (JsonNode legNode : route.path("legs")) {
                List<OsrmStep> steps = new ArrayList<>();
                for (JsonNode stepNode : legNode.path("steps")) {
                    steps.add(OsrmStep.builder()
                            .distance(stepNode.path("distance").asDouble())
                            .duration(stepNode.path("duration").asDouble())
                            .instruction(stepNode.path("maneuver").path("instruction").asText(
                                    Optional.ofNullable(stepNode.path("name").asText(null)).orElse("")))
                            .waypointIndex(stepNode.path("weight").asInt(0))
                            .build());
                }

                legs.add(OsrmLeg.builder()
                        .distance(legNode.path("distance").asDouble())
                        .duration(legNode.path("duration").asDouble())
                        .summary(legNode.path("summary").asText())
                        .steps(steps)
                        .build());
            }

            return OsrmRouteResult.builder()
                    .distance(distance)
                    .duration(duration)
                    .geometry(geometry)
                    .waypoints(waypoints)
                    .legs(legs)
                    .build();
        } catch (Exception e) {
            log.error("Failed to parse OSRM response: {}", e.getMessage());
            return null;
        }
    }

    public double[] getNearestRoad(double lat, double lng) {
        String url = String.format("/nearest/v1/driving/%f,%f", lng, lat);

        log.debug("Finding nearest road from OSRM: {}", url);

        try {
            String jsonResponse = osrmRestTemplate.getForObject(url, String.class);
            if (jsonResponse == null) return null;

            JsonNode root = objectMapper.readTree(jsonResponse);
            JsonNode waypoint = root.path("waypoints").get(0);
            if (waypoint == null) return null;

            return new double[]{
                    waypoint.path("location").get(1).asDouble(),
                    waypoint.path("location").get(0).asDouble()
            };
        } catch (ResourceAccessException e) {
            log.warn("OSRM nearest road service unreachable: {}", e.getMessage());
            return null;
        } catch (Exception e) {
            log.error("Failed to find nearest road: {}", e.getMessage());
            return null;
        }
    }
}
