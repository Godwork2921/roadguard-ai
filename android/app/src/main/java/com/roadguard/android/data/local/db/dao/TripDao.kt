package com.roadguard.android.data.local.db.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import com.roadguard.android.data.local.db.entity.TripEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface TripDao {

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTrip(trip: TripEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTrips(trips: List<TripEntity>)

    @Update
    suspend fun updateTrip(trip: TripEntity)

    @Query("SELECT * FROM trips WHERE id = :tripId")
    suspend fun getTrip(tripId: String): TripEntity?

    @Query("SELECT * FROM trips WHERE id = :tripId")
    fun observeTrip(tripId: String): Flow<TripEntity?>

    @Query("SELECT * FROM trips ORDER BY startTime DESC")
    fun getAllTrips(): Flow<List<TripEntity>>

    @Query("SELECT * FROM trips WHERE status = :status ORDER BY startTime DESC")
    fun getTripsByStatus(status: String): Flow<List<TripEntity>>

    @Query("SELECT * FROM trips WHERE status = 'active' LIMIT 1")
    suspend fun getActiveTrip(): TripEntity?

    @Query("SELECT * FROM trips WHERE status = 'active' LIMIT 1")
    fun observeActiveTrip(): Flow<TripEntity?>

    @Query("SELECT * FROM trips WHERE isSynced = 0")
    suspend fun getUnsyncedTrips(): List<TripEntity>

    @Query("UPDATE trips SET isSynced = 1 WHERE id = :tripId")
    suspend fun markAsSynced(tripId: String)

    @Query("DELETE FROM trips WHERE id = :tripId")
    suspend fun deleteTrip(tripId: String)

    @Query("DELETE FROM trips WHERE isSynced = 1 AND status = 'completed'")
    suspend fun deleteSyncedCompletedTrips()

    @Query("SELECT COUNT(*) FROM trips WHERE status = 'completed'")
    fun observeCompletedTripCount(): Flow<Int>

    @Query("SELECT COALESCE(SUM(distanceKm), 0) FROM trips WHERE status = 'completed'")
    fun observeTotalDistance(): Flow<Double>
}
