package com.roadguard.android.data.local.db.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "trips")
data class TripEntity(
    @PrimaryKey val id: String,
    val startLat: Double,
    val startLng: Double,
    val endLat: Double? = null,
    val endLng: Double? = null,
    val startTime: Long,
    val endTime: Long? = null,
    val distanceKm: Double = 0.0,
    val durationMinutes: Int = 0,
    val avgSpeedKmh: Double = 0.0,
    val maxSpeedKmh: Double = 0.0,
    val status: String = "active",
    val hazardCount: Int = 0,
    val roadConditionScore: Double? = null,
    val isSynced: Boolean = false,
    val lastUpdatedAt: Long = System.currentTimeMillis()
)
