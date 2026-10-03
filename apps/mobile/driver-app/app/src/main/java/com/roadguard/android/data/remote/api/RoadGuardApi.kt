package com.roadguard.android.data.remote.api

import com.roadguard.android.data.remote.dto.AuthResponse
import com.roadguard.android.data.remote.dto.HazardDTO
import com.roadguard.android.data.remote.dto.LocationUpdateRequest
import com.roadguard.android.data.remote.dto.LoginRequest
import com.roadguard.android.data.remote.dto.NotificationsResponse
import com.roadguard.android.data.remote.dto.RegisterRequest
import com.roadguard.android.data.remote.dto.RouteAnalysisRequest
import com.roadguard.android.data.remote.dto.RouteAnalysisResponse
import com.roadguard.android.data.remote.dto.SyncBatchRequest
import com.roadguard.android.data.remote.dto.SyncBatchResponse
import com.roadguard.android.data.remote.dto.TripDTO
import com.roadguard.android.data.remote.dto.UserProfileResponse
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.PUT
import retrofit2.http.Path
import retrofit2.http.Query

interface RoadGuardApi {

    // Auth
    @POST("auth/login")
    suspend fun login(@Body request: LoginRequest): Response<AuthResponse>

    @POST("auth/register")
    suspend fun register(@Body request: RegisterRequest): Response<AuthResponse>

    @POST("auth/refresh")
    suspend fun refreshToken(@Body body: Map<String, String>): Response<AuthResponse>

    @POST("auth/logout")
    suspend fun logout(): Response<Unit>

    @GET("auth/profile")
    suspend fun getProfile(): Response<UserProfileResponse>

    @PUT("auth/profile")
    suspend fun updateProfile(@Body body: Map<String, String>): Response<UserProfileResponse>

    // Trips
    @POST("trips")
    suspend fun startTrip(@Body body: Map<String, String>): Response<TripDTO>

    @PUT("trips/{tripId}")
    suspend fun endTrip(
        @Path("tripId") tripId: String,
        @Body body: Map<String, Any>
    ): Response<TripDTO>

    @GET("trips")
    suspend fun getTrips(
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 20
    ): Response<List<TripDTO>>

    @GET("trips/{tripId}")
    suspend fun getTrip(@Path("tripId") tripId: String): Response<TripDTO>

    @DELETE("trips/{tripId}")
    suspend fun deleteTrip(@Path("tripId") tripId: String): Response<Unit>

    // GPS / Location
    @POST("trips/{tripId}/locations")
    suspend fun uploadLocationBatch(
        @Path("tripId") tripId: String,
        @Body locations: List<LocationUpdateRequest>
    ): Response<Unit>

    @GET("trips/{tripId}/locations")
    suspend fun getTripLocations(
        @Path("tripId") tripId: String,
        @Query("from") fromTimestamp: Long? = null,
        @Query("to") toTimestamp: Long? = null
    ): Response<List<LocationUpdateRequest>>

    // Hazards
    @POST("hazards")
    suspend fun reportHazard(@Body hazard: HazardDTO): Response<HazardDTO>

    @GET("hazards")
    suspend fun getHazards(
        @Query("lat") lat: Double? = null,
        @Query("lng") lng: Double? = null,
        @Query("radius") radius: Double? = null,
        @Query("severity") severity: String? = null,
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 50
    ): Response<List<HazardDTO>>

    @GET("hazards/{hazardId}")
    suspend fun getHazardDetail(@Path("hazardId") hazardId: String): Response<HazardDTO>

    @PUT("hazards/{hazardId}")
    suspend fun updateHazard(
        @Path("hazardId") hazardId: String,
        @Body hazard: HazardDTO
    ): Response<HazardDTO>

    @DELETE("hazards/{hazardId}")
    suspend fun deleteHazard(@Path("hazardId") hazardId: String): Response<Unit>

    @GET("hazards/nearby")
    suspend fun getNearbyHazards(
        @Query("lat") lat: Double,
        @Query("lng") lng: Double,
        @Query("radius") radius: Double = 1000.0
    ): Response<List<HazardDTO>>

    // Routes
    @POST("routes/analyze")
    suspend fun analyzeRoute(
        @Body request: RouteAnalysisRequest
    ): Response<RouteAnalysisResponse>

    @GET("routes/{routeId}")
    suspend fun getRouteAnalysis(@Path("routeId") routeId: String): Response<RouteAnalysisResponse>

    @GET("routes/history")
    suspend fun getRouteHistory(
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 20
    ): Response<List<RouteAnalysisResponse>>

    // Notifications
    @GET("notifications")
    suspend fun getNotifications(
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 50,
        @Query("unreadOnly") unreadOnly: Boolean = false
    ): Response<NotificationsResponse>

    @PUT("notifications/{notificationId}/read")
    suspend fun markNotificationRead(
        @Path("notificationId") notificationId: String
    ): Response<Unit>

    @PUT("notifications/read-all")
    suspend fun markAllNotificationsRead(): Response<Unit>

    @POST("notifications/register-device")
    suspend fun registerDeviceToken(@Body body: Map<String, String>): Response<Unit>

    // Analytics
    @POST("analytics/event")
    suspend fun trackEvent(@Body body: Map<String, Any>): Response<Unit>

    @GET("analytics/driver-stats")
    suspend fun getDriverStats(): Response<Map<String, Any>>

    @GET("analytics/trip-summary/{tripId}")
    suspend fun getTripAnalytics(@Path("tripId") tripId: String): Response<Map<String, Any>>

    // Map data
    @GET("map/tiles/{z}/{x}/{y}")
    suspend fun getMapTile(
        @Path("z") zoom: Int,
        @Path("x") x: Int,
        @Path("y") y: Int
    ): Response<ByteArray>

    @GET("map/hazard-heatmap")
    suspend fun getHazardHeatmap(
        @Query("bounds") bounds: String,
        @Query("zoom") zoom: Int
    ): Response<List<Map<String, Any>>>

    // Sync
    @POST("sync/batch")
    suspend fun syncBatch(@Body batch: SyncBatchRequest): Response<SyncBatchResponse>

    @GET("sync/status")
    suspend fun getSyncStatus(): Response<Map<String, Any>>
}
