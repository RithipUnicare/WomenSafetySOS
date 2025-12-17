package com.womensafetysos

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import androidx.core.content.ContextCompat

class SOSReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent?) {
        if (intent?.action == "ACTION_SOS") {
            val serviceIntent = Intent(context, SOSForegroundService::class.java)
            ContextCompat.startForegroundService(context, serviceIntent)
        }
    }
}
