package com.roadguard.android.data.local.db.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import com.roadguard.android.data.local.db.entity.HazardReportEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface HazardReportDao {

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertHazard(hazard: HazardReportEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertHazards(hazards: List<HazardReportEntity>)

    @Update
    suspend fun updateHazard(hazard: HazardReportEntity)

    @Query("SELECT * FROM hazard_reports WHERE id = :hazardId")
    suspend fun getHazard(hazardId: String): HazardReportEntity?

    @Query("SELECT * FROM hazard_reports WHERE id = :hazardId")
    fun observeHazard(hazardId: String): Flow<HazardReportEntity?>

    @Query("SELECT * FROM hazard_reports ORDER BY reportedAt DESC")
    fun getAllHazards(): Flow<List<HazardReportEntity>>

    @Query("SELECT * FROM hazard_reports WHERE isSynced = 0")
    suspend fun getUnsyncedHazards(): List<HazardReportEntity>

    @Query("SELECT * FROM hazard_reports ORDER BY reportedAt DESC LIMIT :limit")
    fun getRecentHazards(limit: Int = 20): Flow<List<HazardReportEntity>>

    @Query("UPDATE hazard_reports SET isSynced = 1 WHERE id = :hazardId")
    suspend fun markAsSynced(hazardId: String)

    @Query("DELETE FROM hazard_reports WHERE id = :hazardId")
    suspend fun deleteHazard(hazardId: String)

    @Query("DELETE FROM hazard_reports WHERE isSynced = 1")
    suspend fun deleteSyncedHazards()

    @Query("SELECT COUNT(*) FROM hazard_reports WHERE severity = :severity")
    fun observeHazardCountBySeverity(severity: String): Flow<Int>
}
