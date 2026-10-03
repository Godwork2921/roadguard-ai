package com.roadguard.android.data.local.db.entity

import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "hazard_reports",
    indices = [Index(value = ["isSynced"])]
)
data class HazardReportEntity(
    @PrimaryKey val id: String,
    val tripId: String? = null,
    val lat: Double,
    val lng: Double,
    val hazardType: String,
    val severity: String = "medium",
    val description: String = "",
    val photoUri: String? = null,
    val status: String = "reported",
    val reportedAt: Long = System.currentTimeMillis(),
    val isSynced: Boolean = false
)
