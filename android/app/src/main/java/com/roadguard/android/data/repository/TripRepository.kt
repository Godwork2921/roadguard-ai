package com.roadguard.android.data.repository

import com.roadguard.android.data.local.db.dao.LocationDao
import com.roadguard.android.data.local.db.dao.TripDao
import com.roadguard.android.data.local.db.entity.LocationEntity
import com.roadguard.android.data.local.db.entity.TripEntity
import com.roadguard.android.data.remote.api.ApiClient
import com.roadguard.android.data.remote.dto.TripDTO
import kotlinx.coroutines.flow.Flow
import java.util.UUID
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class TripRepository @Inject constructor(
    private val tripDao: TripDao,
    private val locationDao: LocationDao
) {

    fun observeActiveTrip(): Flow<TripEntity?> = tripDao.observeActiveTrip()

    fun observeAllTrips(): Flow<List<TripEntity>> = tripDao.getAllTrips()

    fun observeTrip(tripId: String): Flow<TripEntity?> = tripDao.observeTrip(tripId)

    fun observeCompletedTripCount(): Flow<Int> = tripDao.observeCompletedTripCount()

    fun observeTotalDistance(): Flow<Double> = tripDao.observeTotalDistance()

    suspend fun startTrip(startLat: Double, startLng: Double): Result<TripEntity> {
        return try {
            val tripId = UUID.randomUUID().toString()
            val trip = TripEntity(
                id = tripId,
                startLat = startLat,
                startLng = startLng,
                startTime = System.currentTimeMillis(),
                status = "active"
            )
            tripDao.insertTrip(trip)
            syncTripToServer(trip)
            Result.success(trip)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun endTrip(
        tripId: String,
        endLat: Double,
        endLng: Double,
        distanceKm: Double,
        durationMinutes: Int,
        avgSpeedKmh: Double,
        maxSpeedKmh: Double
    ): Result<TripEntity> {
        return try {
            val trip = tripDao.getTrip(tripId) ?: return Result.failure(
                Exception("Trip not found")
            )
            val updatedTrip = trip.copy(
                endLat = endLat,
                endLng = endLng,
                endTime = System.currentTimeMillis(),
                distanceKm = distanceKm,
                durationMinutes = durationMinutes,
                avgSpeedKmh = avgSpeedKmh,
                maxSpeedKmh = maxSpeedKmh,
                status = "completed",
                lastUpdatedAt = System.currentTimeMillis()
            )
            tripDao.updateTrip(updatedTrip)
            syncTripToServer(updatedTrip)
            Result.success(updatedTrip)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun insertLocation(location: LocationEntity) {
        locationDao.insertLocation(location)
    }

    suspend fun insertLocations(locations: List<LocationEntity>) {
        locationDao.insertLocations(locations)
    }

    suspend fun getLocationsForTrip(tripId: String): List<LocationEntity> {
        return locationDao.getLocationsForTrip(tripId)
    }

    suspend fun getActiveTrip(): TripEntity? = tripDao.getActiveTrip()

    private suspend fun syncTripToServer(trip: TripEntity) {
        try {
            val dto = TripDTO(
                id = trip.id,
                startLocation = com.roadguard.android.data.remote.dto.GeoPointDTO(
                    lat = trip.startLat,
                    lng = trip.startLng
                ),
                endLocation = if (trip.endLat != null && trip.endLng != null) {
                    com.roadguard.android.data.remote.dto.GeoPointDTO(trip.endLat, trip.endLng)
                } else null,
                startTime = trip.startTime.toString(),
                endTime = trip.endTime?.toString(),
                distanceKm = trip.distanceKm,
                durationMinutes = trip.durationMinutes,
                avgSpeedKmh = trip.avgSpeedKmh,
                maxSpeedKmh = trip.maxSpeedKmh,
                status = trip.status,
                hazardCount = trip.hazardCount,
                roadConditionScore = trip.roadConditionScore
            )
            if (trip.status == "active") {
                ApiClient.roadGuardApi.startTrip(mapOf("trip_id" to trip.id))
            } else {
                ApiClient.roadGuardApi.endTrip(trip.id, mapOf(
                    "end_lat" to (trip.endLat ?: 0.0),
                    "end_lng" to (trip.endLng ?: 0.0),
                    "distance_km" to trip.distanceKm,
                    "duration_minutes" to trip.durationMinutes
                ))
            }
            tripDao.markAsSynced(trip.id)
        } catch (_: Exception) {}
    }
}
