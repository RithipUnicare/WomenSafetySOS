package com.womensafetysos

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Intent
import android.os.IBinder
import android.util.Log
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.async
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class SOSForegroundService : Service() {

    private val serviceJob = Job()
    private val serviceScope = CoroutineScope(Dispatchers.Main + serviceJob)

    // ────────────────────────────────────────────────────────────────────────
    // Lifecycle
    // ────────────────────────────────────────────────────────────────────────

    override fun onCreate() {
        super.onCreate()
        Log.d(TAG, "🚨 SOSForegroundService onCreate()")
        startForeground(NOTIF_ID, buildNotification("SOS Activated", "Processing emergency…"))
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val action = intent?.getStringExtra("action") ?: "full_sos"
        val clickCount = intent?.getIntExtra("click_count", 1) ?: 1
        Log.d(TAG, "🚀 onStartCommand — action=$action clickCount=$clickCount")

        serviceScope.launch {
            try {
                when (action) {
                    "location_only" -> handleLocationOnly()
                    "media_capture" -> handleMediaCapture()
                    else -> handleLocationOnly()    // safe fallback
                }
            } catch (e: Exception) {
                Log.e(TAG, "❌ Error in SOS flow", e)
                updateNotification("❌ Emergency error: ${e.message}")
            } finally {
                Log.d(TAG, "✅ SOS flow done — stopping service (startId=$startId) in 3 s")
                delay(3_000)
                stopSelf(startId)
            }
        }

        return START_NOT_STICKY
    }

    override fun onDestroy() {
        super.onDestroy()
        serviceJob.cancel()
        Log.d(TAG, "🛑 SOSForegroundService destroyed")
    }

    override fun onBind(intent: Intent?): IBinder? = null

    // ────────────────────────────────────────────────────────────────────────
    // Stage 1 — Location only
    // ────────────────────────────────────────────────────────────────────────

    private suspend fun handleLocationOnly() {
        Log.d(TAG, "📍 STAGE 1: handleLocationOnly()")
        updateNotification("📍 Getting your location…")

        val apiHelper = ApiHelper(applicationContext)
        val locationHelper = LocationHelper(applicationContext)

        val locationData = withContext(Dispatchers.IO) {
            locationHelper.getCurrentLocation()
        }

        if (locationData == null) {
            Log.w(TAG, "⚠️ Could not get location")
            updateNotification("⚠️ Could not get location")
            return
        }

        Log.d(TAG, "✅ Location: ${locationData.latitude}, ${locationData.longitude}")
        updateNotification("📍 Sending location…")

        val sent = withContext(Dispatchers.IO) { apiHelper.sendLocation(locationData) }

        if (sent) {
            Log.d(TAG, "✅ Location sent")
            updateNotification("✅ Location sent — tap again within 2 min to record")
        } else {
            Log.w(TAG, "⚠️ Failed to send location")
            updateNotification("⚠️ Failed to send location")
        }
    }

    // ────────────────────────────────────────────────────────────────────────
    // Stage 2 — Audio (1 min) + 3 photos at 1-min gaps — run concurrently
    // ────────────────────────────────────────────────────────────────────────

    private suspend fun handleMediaCapture() {
        Log.d(TAG, "📸 STAGE 2: handleMediaCapture()")
        updateNotification("🎤 Recording audio & 📸 taking photos…")

        val apiHelper = ApiHelper(applicationContext)
        val mediaHelper = MediaHelper(applicationContext)

        if (!mediaHelper.hasRequiredPermissions()) {
            Log.w(TAG, "⚠️ Missing media permissions")
            updateNotification("⚠️ Media permissions required")
            return
        }

        // Start an emergency session to obtain an ID for uploads
        updateNotification("🚨 Starting emergency session…")
        val emergencyId = withContext(Dispatchers.IO) { apiHelper.startEmergency() }

        if (emergencyId == null) {
            Log.e(TAG, "❌ Could not start emergency session")
            updateNotification("❌ Failed to start emergency")
            return
        }
        Log.d(TAG, "📋 Emergency ID: $emergencyId")

        // Launch audio recording and photo capturing concurrently
        val audioJob = serviceScope.async {
            Log.d(TAG, "🎤 Audio recording started")
            updateNotification("🎤 Recording audio for 60 s…")
            val audioPath = mediaHelper.startVoiceRecording(60_000L)
            if (audioPath != null) {
                Log.d(TAG, "🎤 Audio recorded, uploading…")
                val uploaded = withContext(Dispatchers.IO) {
                    apiHelper.uploadMedia(audioPath, emergencyId)
                }
                Log.d(TAG, if (uploaded) "✅ Audio uploaded" else "⚠️ Audio upload failed")
                mediaHelper.cleanupOldFiles()
            } else {
                Log.w(TAG, "⚠️ Audio recording returned null")
            }
        }

        val photoJob = serviceScope.async {
            Log.d(TAG, "📸 Starting 3-photo loop")
            repeat(3) { index ->
                updateNotification("📸 Taking photo ${index + 1}/3…")
                val photoPath = withContext(Dispatchers.IO) { mediaHelper.capturePhoto() }
                if (photoPath != null) {
                    Log.d(TAG, "📸 Photo ${index + 1} captured, uploading…")
                    val uploaded = withContext(Dispatchers.IO) {
                        apiHelper.uploadMedia(photoPath, emergencyId)
                    }
                    Log.d(TAG, if (uploaded) "✅ Photo ${index + 1} uploaded" else "⚠️ Photo ${index + 1} upload failed")
                } else {
                    Log.w(TAG, "⚠️ Photo ${index + 1} capture failed")
                }

                // Wait 1 minute before taking the next photo (skip wait after last one)
                if (index < 2) {
                    Log.d(TAG, "⏳ Waiting 60s before photo ${index + 2}…")
                    updateNotification("⏳ Next photo in 60 s…")
                    delay(60_000L)
                }
            }
        }

        // Wait for both jobs to finish
        audioJob.await()
        photoJob.await()

        updateNotification("✅ Emergency recording complete — Stay safe")
        Log.d(TAG, "✅ handleMediaCapture() complete")
    }

    // ────────────────────────────────────────────────────────────────────────
    // Notification helpers
    // ────────────────────────────────────────────────────────────────────────

    private fun buildNotification(title: String, message: String): Notification {
        val mgr = getSystemService(NotificationManager::class.java)
        mgr.createNotificationChannel(
            NotificationChannel(CHANNEL_ID, "SOS Service", NotificationManager.IMPORTANCE_HIGH)
        )
        return Notification.Builder(this, CHANNEL_ID)
            .setContentTitle(title)
            .setContentText(message)
            .setSmallIcon(android.R.drawable.ic_dialog_alert)
            .setOngoing(true)
            .build()
    }

    private fun updateNotification(message: String) {
        Log.d(TAG, "🔔 $message")
        val mgr = getSystemService(NotificationManager::class.java)
        mgr.notify(NOTIF_ID, buildNotification("SOS Emergency", message))
    }

    companion object {
        private const val TAG = "SOSService"
        private const val CHANNEL_ID = "SOS_CHANNEL"
        private const val NOTIF_ID = 1
    }
}
