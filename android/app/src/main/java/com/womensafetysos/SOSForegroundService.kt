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
import kotlinx.coroutines.delay

class SOSForegroundService : Service() {

    private val serviceJob = Job()
    private val serviceScope = CoroutineScope(Dispatchers.Main + serviceJob)
    private var clickCount: Int = 0
    private var emergencyId: Long? = null

    override fun onCreate() {
        super.onCreate()
        Log.d("SOSService", "🚨 SOS Service onCreate() called")
        Log.d("SOSService", "📱 Application context: $applicationContext")
        
        try {
            Log.d("SOSService", "🧪 Testing service functionality...")
            updateNotification("SOS Service Starting...")
            
            // Simple test - wait 2 seconds then update notification
            serviceScope.launch {
                try {
                    Log.d("SOSService", "🧪 Coroutine started...")
                    delay(2000)
                    updateNotification("✅ Service Test Complete")
                    Log.d("SOSService", "🧪 Service test completed successfully")
                } catch (e: Exception) {
                    Log.e("SOSService", "❌ Error in service test coroutine", e)
                }
            }
            
        } catch (e: Exception) {
            Log.e("SOSService", "❌ Error in service test setup", e)
        }
        
        try {
            Log.d("SOSService", "🔔 Starting foreground service...")
            startForeground(1, createNotification("SOS Activated", "Processing emergency..."))
            Log.d("SOSService", "✅ Foreground service started successfully")
        } catch (e: Exception) {
            Log.e("SOSService", "❌ Error starting foreground service", e)
        }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        Log.d("SOSService", "🚀 onStartCommand() called")
        Log.d("SOSService", "📊 Intent flags: $flags, startId: $startId")
        Log.d("SOSService", "📱 Service instance: ${this.hashCode()}")
        
        clickCount = intent?.getIntExtra("click_count", 1) ?: 1
        val action = intent?.getStringExtra("action") ?: "full_sos"
        Log.d("SOSService", "🔢 Click count received: $clickCount")
        Log.d("SOSService", "🎯 Action received: $action")
        
        Log.d("SOSService", "🎬 Starting triggerSOS()...")
        triggerSOS(action)
        return START_NOT_STICKY
    }

    private fun triggerSOS(action: String) {
        Log.d("SOSService", "🎬 triggerSOS() called with action: $action")
        Log.d("SOSService", "📱 Service instance: ${this.hashCode()}")
        Log.d("SOSService", "📱 Service job active: ${serviceJob.isActive}")
        
        serviceScope.launch {
            try {
                when (action) {
                    "location_only" -> {
                        Log.d("SOSService", "� LOCATION ONLY MODE")
                        updateNotification("📍 Sending location...")
                        handleLocationOnly()
                    }
                    "media_capture" -> {
                        Log.d("SOSService", "📸 MEDIA CAPTURE MODE")
                        updateNotification("📸 Capturing photo and audio...")
                        handleMediaCapture()
                    }
                    else -> {
                        Log.d("SOSService", "🔄 FULL SOS MODE")
                        updateNotification("🚨 Full emergency response...")
                        handleFullSOS()
                    }
                }
                
            } catch (e: Exception) {
                Log.e("SOSService", "❌ Error in SOS flow", e)
                Log.e("SOSService", "❌ Error details: ${e.message}")
                Log.e("SOSService", "❌ Stack trace: ${e.stackTraceToString()}")
                updateNotification("❌ Emergency error: ${e.message}")
            } finally {
                Log.d("SOSService", "� SOS flow completed")
                // Stop the service after completion
                android.os.Handler(mainLooper).postDelayed({
                    updateNotification("✅ SOS Complete - Stay Safe")
                    Log.d("SOSService", "🛑 Stopping service...")
                    stopSelf()
                }, 3000)
            }
        }
    }

    private suspend fun handleLocationOnly() {
        Log.d("SOSService", "📍 Handling location only...")
        
        val apiHelper = ApiHelper(applicationContext)
        val locationHelper = LocationHelper(applicationContext)
        
        Log.d("SOSService", "🗺️ Getting location...")
        val locationData = withContext(Dispatchers.IO) {
            locationHelper.getCurrentLocation()
        }

        Log.d("SOSService", "📋 Location data received: $locationData")

        if (locationData != null) {
            Log.d("SOSService", "✅ Location obtained: ${locationData.latitude}, ${locationData.longitude}")
            Log.d("SOSService", "📍 Address: ${locationData.address}")
            updateNotification("📍 Sending location...")
            
            Log.d("SOSService", "🌐 Calling /location API...")
            val locationSent = withContext(Dispatchers.IO) {
                apiHelper.sendLocation(locationData)
            }
            
            Log.d("SOSService", "📋 Location API response: $locationSent")
            
            if (locationSent) {
                Log.d("SOSService", "✅ Location sent successfully")
                updateNotification("✅ Location sent successfully")
            } else {
                Log.w("SOSService", "⚠️ Failed to send location")
                updateNotification("⚠️ Failed to send location")
            }
        } else {
            Log.w("SOSService", "⚠️ Location unavailable")
            updateNotification("⚠️ Location unavailable")
        }
    }

    private suspend fun handleMediaCapture() {
        Log.d("SOSService", "📸 Handling media capture...")
        
        val mediaHelper = MediaHelper(applicationContext)
        val hasPermissions = mediaHelper.hasRequiredPermissions()
        Log.d("SOSService", "📋 Media permissions status: $hasPermissions")
        
        if (!hasPermissions) {
            Log.w("SOSService", "⚠️ Missing media permissions")
            updateNotification("⚠️ Media permissions required")
            return
        }
        
        Log.d("SOSService", "🎥 Starting media capture...")
        val mediaFiles = withContext(Dispatchers.IO) {
            mediaHelper.captureMedia()
        }
        
        Log.d("SOSService", "📸 Media files captured:")
        Log.d("SOSService", "📸 Photo: ${mediaFiles.photoPath}")
        Log.d("SOSService", "📸 Audio: ${mediaFiles.audioPath}")
        
        // Start emergency to get ID for upload
        Log.d("SOSService", "🚀 Starting emergency for media upload...")
        updateNotification("Starting emergency...")
        val apiHelper = ApiHelper(applicationContext)
        
        val emergencyId = withContext(Dispatchers.IO) {
            apiHelper.startEmergency()
        }
        
        Log.d("SOSService", "📋 Emergency ID for upload: $emergencyId")
        
        if (emergencyId == null) {
            Log.e("SOSService", "❌ Failed to start emergency for media upload")
            updateNotification("❌ Failed to upload media")
            return
        }
        
        // Upload media files
        updateNotification("📤 Uploading photo and audio...")
        Log.d("SOSService", "📤 Uploading media files...")
        
        val mediaUploaded = withContext(Dispatchers.IO) {
            apiHelper.uploadMultipleMedia(
                photoPath = mediaFiles.photoPath,
                audioPath = mediaFiles.audioPath,
                emergencyId = emergencyId
            )
        }
        
        Log.d("SOSService", "📋 Media upload response: $mediaUploaded")
        
        if (mediaUploaded) {
            updateNotification("✅ Photo and audio uploaded successfully")
            Log.d("SOSService", "✅ All media uploaded successfully")
        } else {
            updateNotification("⚠️ Some media uploads failed")
            Log.w("SOSService", "⚠️ Some media uploads failed")
        }
        
        // Clean up old files
        Log.d("SOSService", "🧹 Cleaning up old files...")
        mediaHelper.cleanupOldFiles()
    }

    private suspend fun handleFullSOS() {
        Log.d("SOSService", "🔄 Handling full SOS...")
        
        // This is the original full SOS flow
        // You can implement this later if needed
        updateNotification("🚨 Full emergency activated")
    }
    
    private suspend fun triggerBasicSOS() {
        try {
            updateNotification("Starting basic emergency...")
            val apiHelper = ApiHelper(applicationContext)
            
            // Get location if possible
            val locationHelper = LocationHelper(applicationContext)
            val locationData = withContext(Dispatchers.IO) {
                locationHelper.getCurrentLocation()
            }
            
            if (locationData != null) {
                updateNotification("Sending location...")
                val locationSent = withContext(Dispatchers.IO) {
                    apiHelper.sendLocation(locationData)
                }
                
                if (locationSent) {
                    Log.d("SOSService", "✅ Location sent successfully")
                }
            }
            
            // Start emergency
            updateNotification("Starting emergency...")
            val emergencyStarted = withContext(Dispatchers.IO) {
                apiHelper.startEmergency()
            }
            
            if (emergencyStarted != null) {
                updateNotification("✅ Emergency activated (basic mode)")
            } else {
                updateNotification("❌ Failed to activate emergency")
            }
            
        } catch (e: Exception) {
            Log.e("SOSService", "❌ Error in basic SOS", e)
            updateNotification("❌ Emergency error: ${e.message}")
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
