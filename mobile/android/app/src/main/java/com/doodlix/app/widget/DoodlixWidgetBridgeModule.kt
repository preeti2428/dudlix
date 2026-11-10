package com.doodlix.app.widget

import android.content.Context
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap

class DoodlixWidgetBridgeModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "DoodlixWidgetBridge"

    @ReactMethod
    fun updateWidgetData(data: ReadableMap, promise: Promise) {
        try {
            val prefs = reactContext.getSharedPreferences(
                DoodlixWidgetProvider.PREFS_NAME,
                Context.MODE_PRIVATE
            )
            val editor = prefs.edit()

            if (data.hasKey("roomId")) {
                editor.putString(DoodlixWidgetProvider.KEY_ROOM_ID, data.getString("roomId"))
            }
            if (data.hasKey("roomName")) {
                editor.putString(DoodlixWidgetProvider.KEY_ROOM_NAME, data.getString("roomName"))
            }
            if (data.hasKey("friendName")) {
                editor.putString(DoodlixWidgetProvider.KEY_FRIEND_NAME, data.getString("friendName"))
            }
            if (data.hasKey("friendInitials")) {
                editor.putString(DoodlixWidgetProvider.KEY_FRIEND_INITIALS, data.getString("friendInitials"))
            }
            if (data.hasKey("lastUpdatedFormatted")) {
                editor.putString(DoodlixWidgetProvider.KEY_LAST_UPDATED, data.getString("lastUpdatedFormatted"))
            }
            if (data.hasKey("theme")) {
                editor.putString(DoodlixWidgetProvider.KEY_THEME, data.getString("theme"))
            }
            if (data.hasKey("isConnected")) {
                editor.putBoolean(DoodlixWidgetProvider.KEY_IS_CONNECTED, data.getBoolean("isConnected"))
            }
            if (data.hasKey("drawingBase64")) {
                editor.putString(DoodlixWidgetProvider.KEY_IMAGE_BASE64, data.getString("drawingBase64"))
            }
            if (data.hasKey("deepLinkUrl")) {
                editor.putString(DoodlixWidgetProvider.KEY_DEEPLINK, data.getString("deepLinkUrl"))
            }

            editor.apply()

            // Request AppWidgetManager refresh immediately
            DoodlixWidgetProvider.updateAllWidgets(reactContext)

            val result = Arguments.createMap()
            result.putBoolean("success", true)
            result.putString("message", "Android widget updated successfully")
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("E_WIDGET_UPDATE", e.localizedMessage, e)
        }
    }

    @ReactMethod
    fun reloadAllWidgets(promise: Promise) {
        try {
            DoodlixWidgetProvider.updateAllWidgets(reactContext)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("E_WIDGET_RELOAD", e.localizedMessage, e)
        }
    }
}

