package com.roadguard.android.data.repository

import android.content.Context
import android.util.Log
import com.roadguard.android.data.local.db.dao.HazardReportDao
import com.roadguard.android.data.local.db.dao.LocationDao
import com.roadguard.android.data.local.db.dao.SyncQueueDao
import com.roadguard.android.data.local.db.dao.TripDao
import com.roadguard.android.data.local.db.entity.SyncQueueEntity
import com.roadguard.android.data.remote.api.ApiClient
import com.roadguard.android.data.remote.dto.LocationUpdateRequest
import com.roadguard.android.data.remote.dto.SyncBatchRequest
import com.roadguard.android.data.remote.dto.SyncBatchResponse
import com.roadguard.android.data.remote.dto.HazardDTO
import com.roadguard.android.data.remote.dto.GeoPointDTO
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.Flow
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class SyncRepository @Inject constructor(
    @ApplicationContext private val context: Context,
    private val tripDao: TripDao,
    private val locationDao: LocationDao,
    private val hazardReportDao: HazardReportDao,
    private val syncQueueDao: SyncQueueDao
) {
    companion object {
        private const val TAG = "SyncRepository"
        private const val MAX_BATCH_SIZE = 500
        private const val MAX_RETRIES = 5
    }

    suspend fun syncAll(): SyncResult {
        var totalSynced = 0
        var totalFailed = 0
        val conflicts = mutableListOf<String>()

        try {
            val locationSyncResult = syncUnsyncedLocations()
            totalSynced += locationSyncResult.first
            totalFailed += locationSyncResult.second

            val hazardSyncResult = syncUnsyncedHazards()
            totalSynced += hazardSyncResult.first
            totalFailed += hazardSyncResult.second

            val queueSyncResult = syncPendingQueue()
            totalSynced += queueSyncResult.first
            totalFailed += queueSyncResult.second
            conflicts.addAll(queueSyncResult.third)

            cleanupSyncedData()
        } catch (e: Exception) {
            Log.e(TAG, "Sync failed: ${e.message}")
        }

        return SyncResult(totalSynced, totalFailed, conflicts)
    }

    private suspend fun syncUnsyncedLocations(): Pair<Int, Int> {
        var synced = 0
        var failed = 0
        try {
            val locations = locationDao.getUnsyncedLocations(MAX_BATCH_SIZE)
            if (locations.isEmpty()) return Pair(0, 0)

            val tripGroups = locations.groupBy { it.tripId }
            for ((tripId, locs) in tripGroups) {
                try {
                    val request = locs.map { loc ->
                        LocationUpdateRequest(
                            lat = loc.lat,
                            lng = loc.lng,
                            accuracy = loc.accuracy,
                            speed = loc.speed,
                            bearing = loc.bearing,
                            altitude = loc.altitude,
                            timestamp = loc.timestamp,
                            tripId = tripId
                        )
                    }
                    val response = ApiClient.roadGuardApi.uploadLocationBatch(tripId, request)
                    if (response.isSuccessful) {
                        locationDao.markAsSynced(locs.map { it.id })
                        synced += locs.size
                    } else {
                        failed += locs.size
                        enqueueForRetry("location", tripId, "bulk_upload",
                            Json.encodeToString(request))
                    }
                } catch (e: Exception) {
                    failed += locs.size
                    Log.w(TAG, "Location sync failed for trip $tripId: ${e.message}")
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Location sync error: ${e.message}")
        }
        return Pair(synced, failed)
    }

    private suspend fun syncUnsyncedHazards(): Pair<Int, Int> {
        var synced = 0
        var failed = 0
        try {
            val hazards = hazardReportDao.getUnsyncedHazards()
            for (hazard in hazards) {
                try {
                    val dto = HazardDTO(
                        id = hazard.id,
                        tripId = hazard.tripId,
                        location = GeoPointDTO(hazard.lat, hazard.lng),
                        hazardType = hazard.hazardType,
                        severity = hazard.severity,
                        description = hazard.description,
                        photoUrl = hazard.photoUri
                    )
                    val response = ApiClient.roadGuardApi.reportHazard(dto)
                    if (response.isSuccessful) {
                        hazardReportDao.markAsSynced(hazard.id)
                        synced++
                    } else {
                        failed++
                        enqueueForRetry("hazard", hazard.id, "create",
                            Json.encodeToString(dto))
                    }
                } catch (e: Exception) {
                    failed++
                    Log.w(TAG, "Hazard sync failed: ${hazard.id}")
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Hazard sync error: ${e.message}")
        }
        return Pair(synced, failed)
    }

    private suspend fun syncPendingQueue(): Triple<Int, Int, List<String>> {
        var synced = 0
        var failed = 0
        val conflicts = mutableListOf<String>()
        try {
            val pending = syncQueueDao.getPendingItems(MAX_BATCH_SIZE) +
                    syncQueueDao.getFailedItems(MAX_RETRIES)
            for (item in pending) {
                try {
                    val response = ApiClient.roadGuardApi.syncBatch(
                        SyncBatchRequest(
                            lastSyncTimestamp = System.currentTimeMillis()
                        )
                    )
                    if (response.isSuccessful) {
                        val result = response.body()!!
                        synced += result.syncedCount
                        if (result.failedCount > 0) {
                            failed += result.failedCount
                        }
                        conflicts.addAll(result.conflicts)
                        syncQueueDao.updateStatus(item.id, "synced")
                    } else {
                        failed++
                        syncQueueDao.markFailed(item.id)
                    }
                } catch (e: Exception) {
                    failed++
                    syncQueueDao.markFailed(item.id)
                    Log.w(TAG, "Queue item sync failed: ${item.id}")
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Queue sync error: ${e.message}")
        }
        return Triple(synced, failed, conflicts)
    }

    private suspend fun enqueueForRetry(
        entityType: String,
        entityId: String,
        operation: String,
        payload: String
    ) {
        syncQueueDao.enqueue(
            SyncQueueEntity(
                entityType = entityType,
                entityId = entityId,
                operation = operation,
                payload = payload,
                status = "pending"
            )
        )
    }

    private suspend fun cleanupSyncedData() {
        val weekAgo = System.currentTimeMillis() - 7 * 24 * 60 * 60 * 1000
        locationDao.deleteSyncedLocations(weekAgo)
        syncQueueDao.deleteSyncedItems()
        syncQueueDao.deletePermanentlyFailedItems(MAX_RETRIES)
    }

    suspend fun getPendingSyncCount(): Int {
        return locationDao.getUnsyncedLocations(Int.MAX_VALUE).size +
                hazardReportDao.getUnsyncedHazards().size +
                syncQueueDao.getPendingCount()
    }

    data class SyncResult(
        val syncedCount: Int,
        val failedCount: Int,
        val conflicts: List<String>
    ) {
        val isSuccessful: Boolean get() = failedCount == 0
    }
}
