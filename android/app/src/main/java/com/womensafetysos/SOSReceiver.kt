package com.womensafetysos

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import androidx.core.content.ContextCompat

class SOSReceiver : BroadcastReceiver() {

    companion object {
        private const val PREFS_NAME = "SOS_CLICK_PREFS"
        private const val CLICK_COUNT_KEY = "click_count"
        private const val LAST_CLICK_TIME_KEY = "last_click_time"
        private const val CLICK_TIMEOUT_MS = 5000L // 5 seconds to detect multiple clicks
        private const val MAX_CLICKS = 2 // Trigger actions after 2 clicks
    }

    override fun onReceive(context: Context, intent: Intent?) {
    android.util.Log.d("SOSReceiver", "🔔 SOSReceiver.onReceive() called")
    android.util.Log.d("SOSReceiver", "📋 Intent action: ${intent?.action}")
    android.util.Log.d("SOSReceiver", "📅 Current time: ${System.currentTimeMillis()}")
    
    if (intent?.action == "ACTION_SOS") {
        android.util.Log.d("SOSReceiver", "✅ Correct ACTION_SOS detected")
        
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val currentTime = System.currentTimeMillis()
        val lastClickTime = prefs.getLong(LAST_CLICK_TIME_KEY, 0)
        
        android.util.Log.d("SOSReceiver", "⏰ Last click time: $lastClickTime")
        android.util.Log.d("SOSReceiver", "⏱️ Time since last click: ${currentTime - lastClickTime}ms")
        
        // Reset count if timeout exceeded
        val clickCount = if (currentTime - lastClickTime > CLICK_TIMEOUT_MS) {
            android.util.Log.d("SOSReceiver", "🔄 Timeout exceeded, resetting count to 1")
            1
        } else {
            val previousCount = prefs.getInt(CLICK_COUNT_KEY, 0)
            val newCount = previousCount + 1
            android.util.Log.d("SOSReceiver", "📈 Incrementing count: $previousCount -> $newCount")
            newCount
        }
        
        // Save updated count and time
        prefs.edit().apply {
            putInt(CLICK_COUNT_KEY, clickCount)
            putLong(LAST_CLICK_TIME_KEY, currentTime)
            android.util.Log.d("SOSReceiver", "💾 Saved click count: $clickCount, time: $currentTime")
            apply()
        }
        
        android.util.Log.d("SOSReceiver", "🔘 SOS click detected! Count: $clickCount")
        android.util.Log.d("SOSReceiver", "🎯 Required clicks: $MAX_CLICKS, Timeout: ${CLICK_TIMEOUT_MS}ms")
        
        if (clickCount == 1) {
            // First click: Don't trigger anything yet, just wait for second click
            android.util.Log.d("SOSReceiver", "⏳ First click detected, waiting for second click...")
            android.util.Log.d("SOSReceiver", "⏱️ User has ${CLICK_TIMEOUT_MS - (currentTime - lastClickTime)}ms remaining")
            
        } else if (clickCount >= MAX_CLICKS) {
            // Second click: Open camera and microphone
            android.util.Log.d("SOSReceiver", "📸 SECOND CLICK: Opening camera and microphone...")
            android.util.Log.d("SOSReceiver", "📊 Final click count: $clickCount")
            
            // Reset count after triggering
            prefs.edit().apply {
                putInt(CLICK_COUNT_KEY, 0)
                android.util.Log.d("SOSReceiver", "🔄 Reset click count after media action")
                apply()
            }
            
            // Start service for camera and microphone
            val serviceIntent = Intent(context, SOSForegroundService::class.java)
            serviceIntent.putExtra("click_count", clickCount)
            serviceIntent.putExtra("action", "media_capture")
            android.util.Log.d("SOSReceiver", "🚀 Starting SOSForegroundService for media...")
            
            try {
                ContextCompat.startForegroundService(context, serviceIntent)
                android.util.Log.d("SOSReceiver", "✅ SOSForegroundService (media) started successfully")
            } catch (e: Exception) {
                android.util.Log.e("SOSReceiver", "❌ Failed to start SOSForegroundService (media)", e)
            }
        } else {
            android.util.Log.d("SOSReceiver", "⏳ Waiting for more clicks... ($clickCount/$MAX_CLICKS)")
            android.util.Log.d("SOSReceiver", "⏱️ User has ${CLICK_TIMEOUT_MS - (currentTime - lastClickTime)}ms remaining")
        }
    } else {
        android.util.Log.w("SOSReceiver", "❌ Unknown action received: ${intent?.action}")
    }
}
}
