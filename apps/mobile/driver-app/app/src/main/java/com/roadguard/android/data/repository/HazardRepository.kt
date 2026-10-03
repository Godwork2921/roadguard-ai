package com.roadguard.android.data.repository

import com.roadguard.android.data.local.db.dao.HazardReportDao
import com.roadguard.android.data.local.db.entity.HazardReportEntity
import com.roadguard.android.data.remote.api.ApiClient
import com.roadguard.android.data.remote.dto.HazardDTO
import kotlinx.coroutines.flow.Flow
import java.util.UUID
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class HazardRepository @Inject constructor(
    private val hazardReportDao: HazardReportDao
) {

    fun observeAllHazards(): Flow<List<HazardReportEntity>> = hazardReportDao.getAllHazards()

    fun observeRecentHazards(limit: Int = 20): Flow<List<HazardReportEntity>> =
        hazardReportDao.getRecentHazards(limit)

    fun observeHazard(hazardId: String): Flow<HazardReportEntity?> =
        hazardReportDao.observeHazard(hazardId)

    fun observeHazardCountBySeverity(severity: String): Flow<Int> =
        hazardReportDao.observeHazardCountBySeverity(severity)

    suspend fun reportHazard(
        lat: Double,
        lng: Double,
        hazardType: String,
        severity: String = "medium",
        description: String = "",
        tripId: String? = null,
        photoUri: String? = null
    ): Result<HazardReportEntity> {
        return try {
            val hazard = HazardReportEntity(
                id = UUID.randomUUID().toString(),
                tripId = tripId,
                lat = lat,
                lng = lng,
                hazardType = hazardType,
                severity = severity,
                description = description,
                photoUri = photoUri,
                reportedAt = System.currentTimeMillis(),
                isSynced = false
            )
            hazardReportDao.insertHazard(hazard)
            syncHazardToServer(hazard)
            Result.success(hazard)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getHazard(hazardId: String): HazardReportEntity? {
        return hazardReportDao.getHazard(hazardId)
    }

    suspend fun fetchNearbyHazards(lat: Double, lng: Double, radius: Double = 1000.0) {
        try {
            val response = ApiClient.roadGuardApi.getNearbyHazards(lat, lng, radius)
            if (response.isSuccessful) {
                val hazards = response.body() ?: return
                val entities = hazards.map { it.toEntity() }
                hazardReportDao.insertHazards(entities)
            }
        } catch (_: Exception) {}
    }

    private suspend fun syncHazardToServer(hazard: HazardReportEntity) {
        try {
            val dto = HazardDTO(
                id = hazard.id,
                tripId = hazard.tripId,
                location = com.roadguard.android.data.remote.dto.GeoPointDTO(
                    lat = hazard.lat,
                    lng = hazard.lng
                ),
                hazardType = hazard.hazardType,
                severity = hazard.severity,
                description = hazard.description,
                photoUrl = hazard.photoUri,
                reportedAt = hazard.reportedAt.toString()
            )
            val response = ApiClient.roadGuardApi.reportHazard(dto)
            if (response.isSuccessful) {
                hazardReportDao.markAsSynced(hazard.id)
            }
        } catch (_: Exception) {}
    }

    private fun HazardDTO.toEntity() = HazardReportEntity(
        id = id,
        tripId = tripId,
        lat = location.lat,
        lng = location.lng,
        hazardType = hazardType,
        severity = severity,
        description = description,
        photoUri = photoUrl,
        status = status,
        reportedAt = reportedAt.toLongOrNull() ?: System.currentTimeMillis(),
        isSynced = true
    )
}
