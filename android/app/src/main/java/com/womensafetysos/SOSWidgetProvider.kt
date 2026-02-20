package com.womensafetysos

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.util.Log
import android.widget.RemoteViews

class SOSWidgetProvider : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        Log.d("SOSWidgetProvider", "🔧 onUpdate() called")
        Log.d("SOSWidgetProvider", "📊 Widget IDs: ${appWidgetIds.contentToString()}")
        
        for (widgetId in appWidgetIds) {
            Log.d("SOSWidgetProvider", "🔧 Updating widget: $widgetId")

            val intent = Intent(context, SOSReceiver::class.java)
            intent.action = "ACTION_SOS"
            Log.d("SOSWidgetProvider", "📋 Intent created: ${intent.action}")

            val pendingIntent = PendingIntent.getBroadcast(
                context,
                widgetId, // Use widgetId as requestCode to avoid conflicts
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            Log.d("SOSWidgetProvider", "📋 PendingIntent created for widget: $widgetId")

            val views = RemoteViews(context.packageName, R.layout.sos_widget)
            views.setOnClickPendingIntent(R.id.widget_root, pendingIntent)
            Log.d("SOSWidgetProvider", "📋 Click intent set on widget_root")

            appWidgetManager.updateAppWidget(widgetId, views)
            Log.d("SOSWidgetProvider", "✅ Widget updated: $widgetId")
        }
        
        Log.d("SOSWidgetProvider", "🔧 onUpdate() completed")
    }
}
