package com.doodlix.app.widget

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

class DoodlixWidgetSyncWorker(
    private val context: Context,
    params: WorkerParameters
) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result = withContext(Dispatchers.IO) {
        val prefs = context.getSharedPreferences(
            DoodlixWidgetProvider.PREFS_NAME,
            Context.MODE_PRIVATE
        )
        val roomId = prefs.getString(DoodlixWidgetProvider.KEY_ROOM_ID, null) ?: return@withContext Result.success()
        val serverUrl = prefs.getString("server_api_url", "http://10.0.2.2:4000") ?: "http://10.0.2.2:4000"

        try {
            val url = URL("$serverUrl/api/widgets/$roomId")
            val connection = url.openConnection() as HttpURLConnection
            connection.requestMethod = "GET"
            connection.connectTimeout = 8000
            connection.readTimeout = 8000

            if (connection.responseCode == 200) {
                val response = connection.inputStream.bufferedReader().use { it.readText() }
                val json = JSONObject(response)
                if (json.optBoolean("success")) {
                    val widgetData = json.getJSONObject("widget")
                    val editor = prefs.edit()
                    editor.putString(DoodlixWidgetProvider.KEY_FRIEND_NAME, widgetData.optString("friendName"))
                    editor.putString(DoodlixWidgetProvider.KEY_FRIEND_INITIALS, widgetData.optString("friendInitials"))
                    editor.putString(DoodlixWidgetProvider.KEY_LAST_UPDATED, widgetData.optString("lastUpdatedFormatted"))
                    editor.putString(DoodlixWidgetProvider.KEY_IMAGE_BASE64, widgetData.optString("drawingSnapshotUrl"))
                    editor.putBoolean(DoodlixWidgetProvider.KEY_IS_CONNECTED, widgetData.optBoolean("isConnected"))
                    editor.apply()

                    // Refresh widget layout on home screen
                    DoodlixWidgetProvider.updateAllWidgets(context)
                }
            }
            Result.success()
        } catch (e: Exception) {
            Result.retry()
        }
    }
}

