package com.womensafetysos

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.util.Log
import androidx.core.content.ContextCompat

class SOSReceiver : BroadcastReceiver() {

    companion object {
        private const val TAG = "SOSReceiver"
        private const val PREFS_NAME = "SOS_CLICK_PREFS"
        private const val CLICK_COUNT_KEY = "click_count"
        private const val LAST_CLICK_TIME_KEY = "last_click_time"

        // 2-minute window for second click
        private const val CLICK_TIMEOUT_MS = 120_000L
    }

    override fun onReceive(context: Context, intent: Intent?) {
        Log.d(TAG, "🔔 SOSReceiver.onReceive() called")
        Log.d(TAG, "📋 Intent action: ${intent?.action}")

        if (intent?.action != "ACTION_SOS") {
            Log.w(TAG, "❌ Unknown action: ${intent?.action}")
            return
        }

        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val currentTime = System.currentTimeMillis()
        val lastClickTime = prefs.getLong(LAST_CLICK_TIME_KEY, 0)
        val timeSinceLast = currentTime - lastClickTime

        Log.d(TAG, "⏱️ Time since last click: ${timeSinceLast}ms (timeout=${CLICK_TIMEOUT_MS}ms)")

        // Reset if timeout exceeded
        val clickCount = if (timeSinceLast > CLICK_TIMEOUT_MS) {
            Log.d(TAG, "🔄 Timeout exceeded — treating as first click")
            1
        } else {
            val prev = prefs.getInt(CLICK_COUNT_KEY, 0)
            val next = prev + 1
            Log.d(TAG, "📈 Click count: $prev → $next")
            next
        }

        // Persist
        prefs.edit().apply {
            putInt(CLICK_COUNT_KEY, clickCount)
            putLong(LAST_CLICK_TIME_KEY, currentTime)
            apply()
        }

        Log.d(TAG, "🔘 Effective click: $clickCount")

        when (clickCount) {
            1 -> {
                // ── STAGE 1: send location ──────────────────────────────────
                Log.d(TAG, "📍 CLICK 1 — Starting location service")
                startService(context, "location_only", clickCount)
            }
            2 -> {
                // ── STAGE 2: record audio + take 3 photos ───────────────────
                Log.d(TAG, "📸 CLICK 2 — Starting media capture service")
                startService(context, "media_capture", clickCount)

                // Reset counter so a 3rd tap is treated as a fresh SOS
                prefs.edit().apply {
                    putInt(CLICK_COUNT_KEY, 0)
                    apply()
                }
            }
            else -> {
                // Extra clicks after 2 — ignore / treat as click 1 next time
                Log.d(TAG, "⏳ Extra click ($clickCount) ignored")
            }
        }
    }

    private fun startService(context: Context, action: String, clickCount: Int) {
        val serviceIntent = Intent(context, SOSForegroundService::class.java).apply {
            putExtra("action", action)
            putExtra("click_count", clickCount)
        }
        try {
            ContextCompat.startForegroundService(context, serviceIntent)
            Log.d(TAG, "✅ SOSForegroundService started with action=$action")
        } catch (e: Exception) {
            Log.e(TAG, "❌ Failed to start SOSForegroundService", e)
        }
    }
}
