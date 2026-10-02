package com.roadguard.roadguardapi.common.util;

import lombok.AccessLevel;
import lombok.NoArgsConstructor;

@NoArgsConstructor(access = AccessLevel.PRIVATE)
public final class GeospatialUtils {

    private static final double EARTH_RADIUS_KM = 6371.0;

    public static double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        double lat1Rad = Math.toRadians(lat1);
        double lon1Rad = Math.toRadians(lon1);
        double lat2Rad = Math.toRadians(lat2);
        double lon2Rad = Math.toRadians(lon2);

        double dlat = lat2Rad - lat1Rad;
        double dlon = lon2Rad - lon1Rad;

        double a = Math.sin(dlat / 2) * Math.sin(dlat / 2)
                + Math.cos(lat1Rad) * Math.cos(lat2Rad)
                * Math.sin(dlon / 2) * Math.sin(dlon / 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return EARTH_RADIUS_KM * c;
    }

    public static boolean isWithinRadius(double lat1, double lon1, double lat2, double lon2, double radiusKm) {
        return calculateDistance(lat1, lon1, lat2, lon2) <= radiusKm;
    }

    public static BoundingBox calculateBoundingBox(double lat, double lon, double radiusKm) {
        double latRad = Math.toRadians(lat);
        double lonRad = Math.toRadians(lon);

        double angularRadius = radiusKm / EARTH_RADIUS_KM;

        double minLat = lat - Math.toDegrees(angularRadius);
        double maxLat = lat + Math.toDegrees(angularRadius);

        double dlon = Math.toDegrees(Math.asin(Math.sin(angularRadius) / Math.cos(latRad)));
        double minLon = lon - dlon;
        double maxLon = lon + dlon;

        return new BoundingBox(minLat, minLon, maxLat, maxLon);
    }

    public record BoundingBox(double minLatitude, double minLongitude, double maxLatitude, double maxLongitude) {
    }
}
