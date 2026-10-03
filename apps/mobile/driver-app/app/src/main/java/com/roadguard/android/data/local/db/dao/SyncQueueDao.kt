package com.roadguard.android.data.local.db.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import com.roadguard.android.data.local.db.entity.SyncQueueEntity

@Dao
interface SyncQueueDao {

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun enqueue(item: SyncQueueEntity): Long

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun enqueueAll(items: List<SyncQueueEntity>): List<Long>

    @Update
    suspend fun update(item: SyncQueueEntity)

    @Query("SELECT * FROM sync_queue WHERE status = 'pending' ORDER BY createdAt ASC LIMIT :limit")
    suspend fun getPendingItems(limit: Int = 50): List<SyncQueueEntity>

    @Query("SELECT * FROM sync_queue WHERE status = 'failed' AND retryCount < :maxRetries ORDER BY createdAt ASC")
    suspend fun getFailedItems(maxRetries: Int = 5): List<SyncQueueEntity>

    @Query("SELECT COUNT(*) FROM sync_queue WHERE status = 'pending'")
    suspend fun getPendingCount(): Int

    @Query("SELECT COUNT(*) FROM sync_queue WHERE status = 'failed'")
    suspend fun getFailedCount(): Int

    @Query("UPDATE sync_queue SET status = :status, retryCount = retryCount + 1, lastAttemptAt = :timestamp WHERE id = :id")
    suspend fun updateStatus(id: Long, status: String, timestamp: Long = System.currentTimeMillis())

    @Query("UPDATE sync_queue SET status = 'failed', retryCount = retryCount + 1, lastAttemptAt = :timestamp WHERE id = :id")
    suspend fun markFailed(id: Long, timestamp: Long = System.currentTimeMillis())

    @Query("DELETE FROM sync_queue WHERE status = 'synced'")
    suspend fun deleteSyncedItems()

    @Query("DELETE FROM sync_queue WHERE status = 'failed' AND retryCount >= :maxRetries")
    suspend fun deletePermanentlyFailedItems(maxRetries: Int = 5)

    @Query("DELETE FROM sync_queue")
    suspend fun clearAll()
}
