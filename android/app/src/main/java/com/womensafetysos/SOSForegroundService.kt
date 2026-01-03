package com.womensafetysos

import android.app.Service
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Intent
import android.os.IBinder
import android.util.Log
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class SOSForegroundService : Service() {

    private val serviceJob = Job()
    private val serviceScope = CoroutineScope(Dispatchers.Main + serviceJob)

    override fun onCreate() {
        super.onCreate()
        Log.d("SOSService", "🚨 SOS Widget Clicked - Service Started!")
        startForeground(1, createNotification("SOS Triggered", "Processing emergency..."))
        triggerSOS()
    }

    private fun triggerSOS() {
        serviceScope.launch {
            try {
                Log.d("SOSService", "🔄 Starting SOS flow...")
                updateNotification("Fetching location...")
                
                // Get location using LocationHelper
                val locationHelper = LocationHelper(applicationContext)
                val locationData = withContext(Dispatchers.IO) {
                    locationHelper.getCurrentLocation()
                }

                if (locationData == null) {
                    Log.w("SOSService", "⚠️ Location unavailable, proceeding without location")
                    updateNotification("⚠️ Emergency triggered (location unavailable)")
                    startEmergencyWithoutLocation()
                    return@launch
                }

                Log.d("SOSService", "📍 Location obtained: ${locationData.address}")
                updateNotification("Sending location...")

                // Send location to backend
                val apiHelper = ApiHelper(applicationContext)
                val locationSent = withContext(Dispatchers.IO) {
                    apiHelper.sendLocation(locationData)
                }

                if (!locationSent) {
                    updateNotification("⚠️ Failed to send location")
                }

                updateNotification("Starting emergency...")

                // Start emergency
                val emergencyStarted = withContext(Dispatchers.IO) {
                    apiHelper.startEmergency()
                }

                if (emergencyStarted) {
                    updateNotification("✅ Emergency activated successfully")
                } else {
                    updateNotification("❌ Failed to activate emergency")
                }

            } catch (e: Exception) {
                updateNotification("❌ Error: ${e.message}")
            } finally {
                // Stop the service after a delay
                android.os.Handler(mainLooper).postDelayed({
                    stopSelf()
                }, 5000)
            }
        }
    }

    private suspend fun startEmergencyWithoutLocation() {
        try {
            val apiHelper = ApiHelper(applicationContext)
            val emergencyStarted = withContext(Dispatchers.IO) {
                apiHelper.startEmergency()
            }

            if (emergencyStarted) {
                updateNotification("✅ Emergency activated (no location)")
            } else {
                updateNotification("❌ Failed to activate emergency")
            }
        } catch (e: Exception) {
            updateNotification("❌ Error: ${e.message}")
        }
    }

    private fun createNotification(title: String, message: String): Notification {
        val channelId = "SOS_CHANNEL"

        val channel = NotificationChannel(
            channelId,
            "SOS Service",
            NotificationManager.IMPORTANCE_HIGH
        )

        val manager = getSystemService(NotificationManager::class.java)
        manager.createNotificationChannel(channel)

        return Notification.Builder(this, channelId)
            .setContentTitle(title)
            .setContentText(message)
            .setSmallIcon(android.R.drawable.ic_dialog_alert)
            .build()
    }

    private fun updateNotification(message: String) {
        val notification = createNotification("SOS Emergency", message)
        val manager = getSystemService(NotificationManager::class.java)
        manager.notify(1, notification)
    }

    override fun onDestroy() {
        super.onDestroy()
        serviceJob.cancel()
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
