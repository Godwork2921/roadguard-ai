package com.roadguard.android.data.local.db.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.roadguard.android.data.local.db.entity.LocationEntity

@Dao
interface LocationDao {

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertLocation(location: LocationEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertLocations(locations: List<LocationEntity>)

    @Query("SELECT * FROM locations WHERE tripId = :tripId ORDER BY timestamp ASC")
    suspend fun getLocationsForTrip(tripId: String): List<LocationEntity>

    @Query("SELECT * FROM locations WHERE tripId = :tripId AND timestamp >= :fromTimestamp ORDER BY timestamp ASC")
    suspend fun getLocationsSince(tripId: String, fromTimestamp: Long): List<LocationEntity>

    @Query("SELECT * FROM locations WHERE isSynced = 0 ORDER BY timestamp ASC LIMIT :limit")
    suspend fun getUnsyncedLocations(limit: Int = 500): List<LocationEntity>

    @Query("SELECT COUNT(*) FROM locations WHERE tripId = :tripId")
    suspend fun getLocationCount(tripId: String): Int

    @Query("UPDATE locations SET isSynced = 1 WHERE id IN (:ids)")
    suspend fun markAsSynced(ids: List<Long>)

    @Query("DELETE FROM locations WHERE isSynced = 1 AND timestamp < :beforeTimestamp")
    suspend fun deleteSyncedLocations(beforeTimestamp: Long)

    @Query("DELETE FROM locations WHERE tripId = :tripId")
    suspend fun deleteLocationsForTrip(tripId: String)
}
