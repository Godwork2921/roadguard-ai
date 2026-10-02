package com.roadguard.android.data.remote.dto

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

// Auth
@Serializable
data class LoginRequest(
    @SerialName("email") val email: String,
    @SerialName("password") val password: String
)

@Serializable
data class RegisterRequest(
    @SerialName("email") val email: String,
    @SerialName("password") val password: String,
    @SerialName("full_name") val fullName: String,
    @SerialName("phone") val phone: String = "",
    @SerialName("vehicle_type") val vehicleType: String = "car"
)

@Serializable
data class AuthResponse(
    @SerialName("access_token") val accessToken: String,
    @SerialName("refresh_token") val refreshToken: String,
    @SerialName("expires_in") val expiresIn: Long,
    @SerialName("user") val user: UserDTO
)

@Serializable
data class UserDTO(
    @SerialName("id") val id: String,
    @SerialName("email") val email: String,
    @SerialName("full_name") val fullName: String,
    @SerialName("phone") val phone: String = "",
    @SerialName("avatar_url") val avatarUrl: String? = null,
    @SerialName("vehicle_type") val vehicleType: String = "car",
    @SerialName("is_verified") val isVerified: Boolean = false,
    @SerialName("created_at") val createdAt: String = "",
    @SerialName("emergency_contacts") val emergencyContacts: List<EmergencyContactDTO> = emptyList()
)

@Serializable
data class UserProfileResponse(
    @SerialName("user") val user: UserDTO,
    @SerialName("stats") val stats: DriverStatsDTO? = null
)

@Serializable
data class EmergencyContactDTO(
    @SerialName("name") val name: String,
    @SerialName("phone") val phone: String,
    @SerialName("relationship") val relationship: String
)

// Trips
@Serializable
data class TripDTO(
    @SerialName("id") val id: String,
    @SerialName("user_id") val userId: String = "",
    @SerialName("start_location") val startLocation: GeoPointDTO,
    @SerialName("end_location") val endLocation: GeoPointDTO? = null,
    @SerialName("start_time") val startTime: String,
    @SerialName("end_time") val endTime: String? = null,
    @SerialName("distance_km") val distanceKm: Double = 0.0,
    @SerialName("duration_minutes") val durationMinutes: Int = 0,
    @SerialName("avg_speed_kmh") val avgSpeedKmh: Double = 0.0,
    @SerialName("max_speed_kmh") val maxSpeedKmh: Double = 0.0,
    @SerialName("status") val status: String = "active",
    @SerialName("route_polyline") val routePolyline: String? = null,
    @SerialName("hazard_count") val hazardCount: Int = 0,
    @SerialName("road_condition_score") val roadConditionScore: Double? = null,
    @SerialName("is_synced") val isSynced: Boolean = true
)

@Serializable
data class GeoPointDTO(
    @SerialName("lat") val lat: Double,
    @SerialName("lng") val lng: Double
)

// Location
@Serializable
data class LocationUpdateRequest(
    @SerialName("lat") val lat: Double,
    @SerialName("lng") val lng: Double,
    @SerialName("accuracy") val accuracy: Float = 0f,
    @SerialName("speed") val speed: Float = 0f,
    @SerialName("bearing") val bearing: Float = 0f,
    @SerialName("altitude") val altitude: Double = 0.0,
    @SerialName("timestamp") val timestamp: Long,
    @SerialName("trip_id") val tripId: String? = null
)

// Hazards
@Serializable
data class HazardDTO(
    @SerialName("id") val id: String = "",
    @SerialName("trip_id") val tripId: String? = null,
    @SerialName("user_id") val userId: String = "",
    @SerialName("location") val location: GeoPointDTO,
    @SerialName("hazard_type") val hazardType: String,
    @SerialName("severity") val severity: String = "medium",
    @SerialName("description") val description: String = "",
    @SerialName("photo_url") val photoUrl: String? = null,
    @SerialName("status") val status: String = "reported",
    @SerialName("verified_by") val verifiedBy: Int? = null,
    @SerialName("reported_at") val reportedAt: String = "",
    @SerialName("expires_at") val expiresAt: String? = null,
    @SerialName("upvotes") val upvotes: Int = 0,
    @SerialName("downvotes") val downvotes: Int = 0,
    @SerialName("is_synced") val isSynced: Boolean = true
)

// Route Analysis
@Serializable
data class RouteAnalysisRequest(
    @SerialName("origin") val origin: GeoPointDTO,
    @SerialName("destination") val destination: GeoPointDTO,
    @SerialName("waypoints") val waypoints: List<GeoPointDTO> = emptyList(),
    @SerialName("avoid_hazards") val avoidHazards: Boolean = true,
    @SerialName("prefer_safe_roads") val preferSafeRoads: Boolean = true,
    @SerialName("time_preference") val timePreference: String = "balanced"
)

@Serializable
data class RouteAnalysisResponse(
    @SerialName("id") val id: String,
    @SerialName("routes") val routes: List<RouteOptionDTO>,
    @SerialName("hazard_warnings") val hazardWarnings: List<HazardDTO> = emptyList(),
    @SerialName("recommended_route_index") val recommendedRouteIndex: Int = 0
)

@Serializable
data class RouteOptionDTO(
    @SerialName("distance_km") val distanceKm: Double,
    @SerialName("duration_minutes") val durationMinutes: Int,
    @SerialName("polyline") val polyline: String,
    @SerialName("safety_score") val safetyScore: Double = 0.0,
    @SerialName("hazard_count") val hazardCount: Int = 0,
    @SerialName("road_conditions") val roadConditions: List<String> = emptyList()
)

// Notifications
@Serializable
data class NotificationsResponse(
    @SerialName("notifications") val notifications: List<NotificationDTO>,
    @SerialName("unread_count") val unreadCount: Int,
    @SerialName("total") val total: Int,
    @SerialName("page") val page: Int = 1
)

@Serializable
data class NotificationDTO(
    @SerialName("id") val id: String,
    @SerialName("title") val title: String,
    @SerialName("body") val body: String,
    @SerialName("type") val type: String,
    @SerialName("data") val data: Map<String, String> = emptyMap(),
    @SerialName("is_read") val isRead: Boolean = false,
    @SerialName("created_at") val created_at: String
)

// Stats
@Serializable
data class DriverStatsDTO(
    @SerialName("total_trips") val totalTrips: Int = 0,
    @SerialName("total_distance_km") val totalDistanceKm: Double = 0.0,
    @SerialName("total_duration_minutes") val totalDurationMinutes: Int = 0,
    @SerialName("hazards_reported") val hazardsReported: Int = 0,
    @SerialName("safety_score") val safetyScore: Double = 0.0,
    @SerialName("avg_speed_kmh") val avgSpeedKmh: Double = 0.0,
    @SerialName("this_week_trips") val thisWeekTrips: Int = 0,
    @SerialName("this_month_distance") val thisMonthDistance: Double = 0.0
)

// Sync
@Serializable
data class SyncBatchRequest(
    @SerialName("locations") val locations: List<LocationUpdateRequest> = emptyList(),
    @SerialName("hazards") val hazards: List<HazardDTO> = emptyList(),
    @SerialName("trip_updates") val tripUpdates: List<Map<String, Any>> = emptyList(),
    @SerialName("last_sync_timestamp") val lastSyncTimestamp: Long? = null,
    @SerialName("device_id") val deviceId: String = ""
)

@Serializable
data class SyncBatchResponse(
    @SerialName("synced_count") val syncedCount: Int = 0,
    @SerialName("failed_count") val failedCount: Int = 0,
    @SerialName("conflicts") val conflicts: List<String> = emptyList(),
    @SerialName("server_timestamp") val serverTimestamp: Long
)
