package dji.sampleV5.aircraft.remote

import android.content.Context
import android.os.Build
import org.json.JSONObject
import java.util.UUID

data class RemoteControlConfig(
    val serverUrl: String,
    val deviceId: String,
    val authToken: String,
    val sharedSecret: String,
)

class RemoteControlConfigStore(context: Context) {

    private val prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)

    fun load(): RemoteControlConfig {
        val defaultDeviceId = defaultDeviceId()
        return RemoteControlConfig(
            serverUrl = prefs.getString(KEY_SERVER_URL, DEFAULT_SERVER_URL).orEmpty(),
            deviceId = prefs.getString(KEY_DEVICE_ID, defaultDeviceId).orEmpty(),
            authToken = prefs.getString(KEY_AUTH_TOKEN, "").orEmpty(),
            sharedSecret = prefs.getString(KEY_SHARED_SECRET, "").orEmpty(),
        )
    }

    fun save(config: RemoteControlConfig) {
        prefs.edit()
            .putString(KEY_SERVER_URL, config.serverUrl)
            .putString(KEY_DEVICE_ID, config.deviceId)
            .putString(KEY_AUTH_TOKEN, config.authToken)
            .putString(KEY_SHARED_SECRET, config.sharedSecret)
            .apply()
    }

    fun toJson(config: RemoteControlConfig): String {
        return JSONObject()
            .put("serverUrl", config.serverUrl)
            .put("deviceId", config.deviceId)
            .put("authToken", config.authToken)
            .put("sharedSecret", config.sharedSecret)
            .toString(2)
    }

    fun fromJson(raw: String): RemoteControlConfig {
        val current = load()
        val json = JSONObject(raw)
        return RemoteControlConfig(
            serverUrl = json.optString("serverUrl", current.serverUrl),
            deviceId = json.optString("deviceId", current.deviceId),
            authToken = json.optString("authToken", current.authToken),
            sharedSecret = json.optString("sharedSecret", current.sharedSecret),
        )
    }

    private fun defaultDeviceId(): String {
        val saved = prefs.getString(KEY_DEVICE_ID, null)
        if (!saved.isNullOrBlank()) {
            return saved
        }
        val generated = "${Build.MODEL}-${UUID.randomUUID().toString().take(8)}"
        prefs.edit().putString(KEY_DEVICE_ID, generated).apply()
        return generated
    }

    companion object {
        private const val PREF_NAME = "remote_control_config"
        private const val KEY_SERVER_URL = "server_url"
        private const val KEY_DEVICE_ID = "device_id"
        private const val KEY_AUTH_TOKEN = "auth_token"
        private const val KEY_SHARED_SECRET = "shared_secret"

        private const val DEFAULT_SERVER_URL = "wss://example.com/ws/device/demo-aircraft"
    }
}
