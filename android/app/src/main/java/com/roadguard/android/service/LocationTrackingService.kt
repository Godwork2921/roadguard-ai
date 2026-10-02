package com.roadguard.android.service

import android.app.Notification
import android.app.PendingIntent
import android.app.Service
import android.content.Intent
import android.location.Location
import android.os.IBinder
import android.os.Looper
import androidx.core.app.NotificationCompat
import com.google.android.gms.location.FusedLocationProviderClient
import com.google.android.gms.location.LocationCallback
import com.google.android.gms.location.LocationRequest
import com.google.android.gms.location.LocationResult
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority
import com.roadguard.android.MainActivity
import com.roadguard.android.R
import com.roadguard.android.RoadGuardApp
import com.roadguard.android.data.local.db.dao.LocationDao
import com.roadguard.android.data.local.db.dao.TripDao
import com.roadguard.android.data.local.db.entity.LocationEntity
import com.roadguard.android.data.repository.TripRepository
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import javax.inject.Inject

@AndroidEntryPoint
class LocationTrackingService : Service() {

    @Inject lateinit var tripRepository: TripRepository
    @Inject lateinit var locationDao: LocationDao
    @Inject lateinit var tripDao: TripDao

    private val serviceScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private lateinit var fusedLocationClient: FusedLocationProviderClient
    private var activeTripId: String? = null

    private val locationCallback = object : LocationCallback() {
        override fun onLocationResult(locationResult: LocationResult) {
            val tripId = activeTripId ?: return
            for (location in locationResult.locations) {
                saveLocation(tripId, location)
            }
        }
    }

    override fun onCreate() {
        super.onCreate()
        fusedLocationClient = LocationServices.getFusedLocationProviderClient(this)
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_START_TRACKING -> {
                val tripId = intent.getStringExtra(EXTRA_TRIP_ID) ?: return START_STICKY
                activeTripId = tripId
                startForeground(NOTIFICATION_ID, createTrackingNotification())
                startLocationUpdates()
            }
            ACTION_STOP_TRACKING -> {
                stopLocationUpdates()
                stopSelf()
            }
        }
        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        serviceScope.cancel()
        super.onDestroy()
    }

    private fun startLocationUpdates() {
        val locationRequest = LocationRequest.Builder(
            Priority.PRIORITY_HIGH_ACCURACY,
            LOCATION_UPDATE_INTERVAL_MS
        ).apply {
            setMinUpdateIntervalMillis(LOCATION_MIN_UPDATE_INTERVAL_MS)
            setMaxUpdateDelayMillis(LOCATION_MAX_UPDATE_DELAY_MS)
        }.build()

        try {
            fusedLocationClient.requestLocationUpdates(
                locationRequest,
                locationCallback,
                Looper.getMainLooper()
            )
        } catch (e: SecurityException) {
            stopSelf()
        }
    }

    private fun stopLocationUpdates() {
        fusedLocationClient.removeLocationUpdates(locationCallback)
    }

    private fun saveLocation(tripId: String, location: Location) {
        serviceScope.launch {
            val entity = LocationEntity(
                tripId = tripId,
                lat = location.latitude,
                lng = location.longitude,
                accuracy = location.accuracy,
                speed = if (location.hasSpeed()) location.speed * 3.6f else 0f,
                bearing = if (location.hasBearing()) location.bearing else 0f,
                altitude = if (location.hasAltitude()) location.altitude else 0.0,
                timestamp = System.currentTimeMillis()
            )
            locationDao.insertLocation(entity)
        }
    }

    private fun createTrackingNotification(): Notification {
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            Intent(this, MainActivity::class.java),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(this, RoadGuardApp.LOCATION_SERVICE_CHANNEL_ID)
            .setContentTitle("RoadGuard AI")
            .setContentText("Trip tracking active")
            .setSmallIcon(R.drawable.ic_location_tracking)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setSilent(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }

    companion object {
        const val ACTION_START_TRACKING = "com.roadguard.android.action.START_TRACKING"
        const val ACTION_STOP_TRACKING = "com.roadguard.android.action.STOP_TRACKING"
        const val EXTRA_TRIP_ID = "extra_trip_id"
        const val NOTIFICATION_ID = 1001

        private const val LOCATION_UPDATE_INTERVAL_MS = 5000L
        private const val LOCATION_MIN_UPDATE_INTERVAL_MS = 2000L
        private const val LOCATION_MAX_UPDATE_DELAY_MS = 10000L
    }
}
