package com.doodlix.app.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import android.util.Base64
import android.widget.RemoteViews
import com.doodlix.app.R

class DoodlixWidgetProvider : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId)
        }
    }

    companion object {
        const val PREFS_NAME = "DoodlixWidgetPrefs"
        const val KEY_ROOM_ID = "widget_room_id"
        const val KEY_ROOM_NAME = "widget_room_name"
        const val KEY_FRIEND_NAME = "widget_friend_name"
        const val KEY_FRIEND_INITIALS = "widget_friend_initials"
        const val KEY_LAST_UPDATED = "widget_last_updated"
        const val KEY_THEME = "widget_theme"
        const val KEY_IS_CONNECTED = "widget_is_connected"
        const val KEY_IMAGE_BASE64 = "widget_image_base64"
        const val KEY_DEEPLINK = "widget_deeplink"

        fun updateAppWidget(
            context: Context,
            appWidgetManager: AppWidgetManager,
            appWidgetId: Int
        ) {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val roomId = prefs.getString(KEY_ROOM_ID, "demo_room") ?: "demo_room"
            val friendName = prefs.getString(KEY_FRIEND_NAME, "Connect Friend") ?: "Connect Friend"
            val friendInitials = prefs.getString(KEY_FRIEND_INITIALS, "DX") ?: "DX"
            val lastUpdated = prefs.getString(KEY_LAST_UPDATED, "Just now") ?: "Just now"
            val isConnected = prefs.getBoolean(KEY_IS_CONNECTED, false)
            val imageBase64 = prefs.getString(KEY_IMAGE_BASE64, null)
            val deepLink = prefs.getString(KEY_DEEPLINK, "doodlix://draw/$roomId")

            // Determine widget layout based on dimensions
            val options = appWidgetManager.getAppWidgetOptions(appWidgetId)
            val minWidth = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH)
            val minHeight = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_HEIGHT)

            val layoutId = when {
                minHeight >= 220 -> R.layout.doodlix_widget_large
                minWidth >= 220 -> R.layout.doodlix_widget_medium
                else -> R.layout.doodlix_widget_small
            }

            val views = RemoteViews(context.packageName, layoutId)

            // Set dynamic text
            views.setTextViewText(R.id.widget_friend_name, friendName)
            views.setTextViewText(R.id.widget_friend_initials, friendInitials)
            views.setTextViewText(R.id.widget_last_updated, "Synced $lastUpdated")

            // Set Drawing Bitmap if available
            if (!imageBase64.isNullOrEmpty()) {
                val cleanBase64 = if (imageBase64.contains(",")) {
                    imageBase64.substringAfter(",")
                } else {
                    imageBase64
                }
                try {
                    val decodedBytes = Base64.decode(cleanBase64, Base64.DEFAULT)
                    val bitmap = BitmapFactory.decodeByteArray(decodedBytes, 0, decodedBytes.size)
                    views.setImageViewBitmap(R.id.widget_drawing_image, bitmap)
                } catch (e: Exception) {
                    views.setImageViewResource(R.id.widget_drawing_image, R.drawable.ic_doodlix_placeholder)
                }
            } else {
                views.setImageViewResource(R.id.widget_drawing_image, R.drawable.ic_doodlix_placeholder)
            }

            // Tap intent: Deep link straight into the shared drawing canvas
            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(deepLink)).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            }
            val pendingIntent = PendingIntent.getActivity(
                context,
                appWidgetId,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.widget_root, pendingIntent)

            appWidgetManager.updateAppWidget(appWidgetId, views)
        }

        fun updateAllWidgets(context: Context) {
            val appWidgetManager = AppWidgetManager.getInstance(context)
            val thisWidget = ComponentName(context, DoodlixWidgetProvider::class.java)
            val allWidgetIds = appWidgetManager.getAppWidgetIds(thisWidget)
            for (widgetId in allWidgetIds) {
                updateAppWidget(context, appWidgetManager, widgetId)
            }
        }
    }
}

