package com.roadguard.android

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.os.Build
import dagger.hilt.android.HiltAndroidApp

@HiltAndroidApp
class RoadGuardApp : Application() {

    companion object {
        const val LOCATION_SERVICE_CHANNEL_ID = "location_tracking"
        const val HAZARD_ALERT_CHANNEL_ID = "hazard_alerts"
        const val SYNC_CHANNEL_ID = "sync_notifications"
    }

    override fun onCreate() {
        super.onCreate()
        createNotificationChannels()
    }

    private fun createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val locationChannel = NotificationChannel(
                LOCATION_SERVICE_CHANNEL_ID,
                "Location Tracking",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Shows when location is being tracked during active trips"
                setShowBadge(false)
            }

            val hazardChannel = NotificationChannel(
                HAZARD_ALERT_CHANNEL_ID,
                "Hazard Alerts",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Alerts for nearby road hazards"
                enableVibration(true)
            }

            val syncChannel = NotificationChannel(
                SYNC_CHANNEL_ID,
                "Data Sync",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Background data synchronization status"
                setShowBadge(false)
            }

            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(locationChannel)
            manager.createNotificationChannel(hazardChannel)
            manager.createNotificationChannel(syncChannel)
        }
    }
}
