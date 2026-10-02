package com.roadguard.android.data.local.db

import androidx.room.Database
import androidx.room.RoomDatabase
import com.roadguard.android.data.local.db.dao.HazardReportDao
import com.roadguard.android.data.local.db.dao.LocationDao
import com.roadguard.android.data.local.db.dao.SyncQueueDao
import com.roadguard.android.data.local.db.dao.TripDao
import com.roadguard.android.data.local.db.entity.HazardReportEntity
import com.roadguard.android.data.local.db.entity.LocationEntity
import com.roadguard.android.data.local.db.entity.SyncQueueEntity
import com.roadguard.android.data.local.db.entity.TripEntity

@Database(
    entities = [
        TripEntity::class,
        LocationEntity::class,
        HazardReportEntity::class,
        SyncQueueEntity::class
    ],
    version = 1,
    exportSchema = true
)
abstract class RoadGuardDatabase : RoomDatabase() {
    abstract fun tripDao(): TripDao
    abstract fun locationDao(): LocationDao
    abstract fun hazardReportDao(): HazardReportDao
    abstract fun syncQueueDao(): SyncQueueDao

    companion object {
        const val DATABASE_NAME = "roadguard_db"
    }
}
