package dji.sampleV5.aircraft.remote

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import dji.sampleV5.aircraft.DJIAircraftMainActivity
import dji.sampleV5.aircraft.R
import dji.v5.manager.SDKManager
import dji.v5.utils.common.LogUtils
import org.json.JSONObject
import java.nio.charset.StandardCharsets
import java.security.MessageDigest
import javax.crypto.Mac
import javax.crypto.spec.SecretKeySpec
import java.util.LinkedHashMap
import java.util.concurrent.atomic.AtomicLong
import java.util.concurrent.Executors
import java.util.concurrent.ScheduledFuture
import java.util.concurrent.TimeUnit

class RemoteControlService : Service(), RemoteSocketClient.Listener {

    private val tag = LogUtils.getTag("RemoteControlService")
    private lateinit var configStore: RemoteControlConfigStore
    private lateinit var commandExecutor: RemoteCommandExecutor
    private lateinit var socketClient: RemoteSocketClient
    private var telemetryExecutor = Executors.newSingleThreadScheduledExecutor()
    private var telemetryTask: ScheduledFuture<*>? = null
    private var currentConfig: RemoteControlConfig? = null
    private val telemetryCount = AtomicLong(0)

    private val nonceCache = object : LinkedHashMap<String, Long>(MAX_NONCE_CACHE + 1, 0.75f, true) {
        override fun removeEldestEntry(eldest: MutableMap.MutableEntry<String, Long>?): Boolean {
            return size > MAX_NONCE_CACHE
        }
    }

    override fun onCreate() {
        super.onCreate()
        LogUtils.i(tag, "service onCreate")
        configStore = RemoteControlConfigStore(applicationContext)
        commandExecutor = RemoteCommandExecutor()
        socketClient = RemoteSocketClient(this)
        commandExecutor.start()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        LogUtils.i(tag, "onStartCommand action=${intent?.action} startId=$startId")
        when (intent?.action) {
            ACTION_START -> {
                startForeground(NOTIFICATION_ID, buildNotification())
                startSession()
            }

            ACTION_STOP -> {
                stopSession()
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                    stopForeground(STOP_FOREGROUND_REMOVE)
                } else {
                    stopForeground(true)
                }
                stopSelf()
            }
        }
        return START_STICKY
    }

    override fun onDestroy() {
        LogUtils.i(tag, "service onDestroy")
        stopSession()
        commandExecutor.destroy()
        socketClient.release()
        telemetryExecutor.shutdownNow()
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onConnected() {
        LogUtils.i(tag, "websocket connected")
        sendEvent("connected", "")
    }

    override fun onDisconnected(reason: String) {
        LogUtils.i(tag, "websocket disconnected reason=$reason")
        sendEvent("disconnected", reason)
    }

    override fun onMessage(message: String) {
        LogUtils.i(tag, "message received chars=${message.length}")
        handleIncomingMessage(message)
    }

    private fun startSession() {
        currentConfig = configStore.load()
        commandExecutor.start()
        val config = currentConfig ?: return
        LogUtils.i(
            tag,
            "startSession serverUrl=${config.serverUrl} deviceId=${config.deviceId} tokenPresent=${config.authToken.isNotBlank()} secretPresent=${config.sharedSecret.isNotBlank()}"
        )
        if (config.serverUrl.isBlank()) {
            LogUtils.e(tag, "remote server url is empty")
            return
        }
        socketClient.connect(config.serverUrl, config.deviceId, config.authToken)
        startTelemetryLoop()
        sendEvent("session_start", config.deviceId)
    }

    private fun stopSession() {
        LogUtils.i(tag, "stopSession")
        telemetryTask?.cancel(true)
        telemetryTask = null
        socketClient.close()
        commandExecutor.stop()
    }

    private fun startTelemetryLoop() {
        if (telemetryTask != null) {
            LogUtils.i(tag, "telemetry loop already started")
            return
        }
        LogUtils.i(tag, "starting telemetry loop interval=${TELEMETRY_PERIOD_MS}ms")
        telemetryTask = telemetryExecutor.scheduleAtFixedRate({
            publishTelemetry()
        }, 500, TELEMETRY_PERIOD_MS, TimeUnit.MILLISECONDS)
    }

    private fun publishTelemetry() {
        val config = currentConfig ?: return
        val count = telemetryCount.incrementAndGet()
        val telemetry = JSONObject()
            .put("type", "telemetry")
            .put("ts", System.currentTimeMillis())
            .put("deviceId", config.deviceId)
            .put("serverConnected", socketClient.isConnected())
            .put("sdkRegistered", SDKManager.getInstance().isRegistered)
            .put("aircraftConnected", commandExecutor.isAircraftConnected())
            .put("remoteArmed", commandExecutor.isRemoteArmed())
            .put("virtualStickEnabled", commandExecutor.isVirtualStickEnabled())
            .put("lastCommandAt", commandExecutor.getLastCommandAt())
            .put("lastError", commandExecutor.getLastError())
        socketClient.send(telemetry.toString())
        if (count % 10L == 0L) {
            LogUtils.i(
                tag,
                "telemetry sent count=$count connected=${socketClient.isConnected()} aircraftConnected=${commandExecutor.isAircraftConnected()}"
            )
        }
    }

    private fun handleIncomingMessage(rawMessage: String) {
        try {
            val json = JSONObject(rawMessage)
            val type = json.optString("type", "").lowercase()
            LogUtils.i(tag, "handleIncomingMessage type=$type")
            when (type) {
                "command" -> {
                    val command = RemoteCommand.fromJson(json)
                    LogUtils.i(tag, "command received id=${command.commandId} name=${command.name}")
                    val ack = if (isCommandAuthorized(command)) {
                        commandExecutor.execute(command)
                    } else {
                        RemoteAck(command.commandId, false, "command rejected by security checks")
                    }
                    socketClient.send(ack.toJson())
                    LogUtils.i(tag, "ack sent id=${ack.commandId} success=${ack.success} message=${ack.message}")
                }

                "ping" -> {
                    socketClient.send(JSONObject().put("type", "pong").put("ts", System.currentTimeMillis()).toString())
                    LogUtils.i(tag, "ping received, pong sent")
                }

                else -> {
                    LogUtils.i(tag, "ignored message type=$type")
                }
            }
        } catch (e: Exception) {
            LogUtils.e(tag, "handle message error:${e.message} raw=$rawMessage")
        }
    }

    private fun isCommandAuthorized(command: RemoteCommand): Boolean {
        if (command.commandId.isBlank() || command.name.isBlank()) {
            LogUtils.e(tag, "authorization failed: missing commandId/name")
            return false
        }
        val now = System.currentTimeMillis()
        val ttl = command.ttlMs.coerceIn(500L, 60_000L)
        if (kotlin.math.abs(now - command.timestampMs) > ttl) {
            LogUtils.e(tag, "authorization failed: ttl check failed commandId=${command.commandId}")
            return false
        }
        if (command.nonce.isBlank()) {
            LogUtils.e(tag, "authorization failed: empty nonce commandId=${command.commandId}")
            return false
        }
        synchronized(nonceCache) {
            if (nonceCache.containsKey(command.nonce)) {
                LogUtils.e(tag, "authorization failed: replay nonce commandId=${command.commandId}")
                return false
            }
            nonceCache[command.nonce] = now
        }
        val secret = currentConfig?.sharedSecret.orEmpty()
        if (secret.isBlank()) {
            LogUtils.i(tag, "authorization accepted: shared secret disabled")
            return true
        }
        if (command.signature.isBlank()) {
            LogUtils.e(tag, "authorization failed: signature missing commandId=${command.commandId}")
            return false
        }
        val payload = command.payloadRaw
        val dataToSign = "${command.commandId}|${command.name}|${command.timestampMs}|${command.nonce}|$payload"
        val expected = hmacSha256Hex(secret, dataToSign)
        val matched = MessageDigest.isEqual(
            expected.toByteArray(StandardCharsets.UTF_8),
            command.signature.toByteArray(StandardCharsets.UTF_8),
        )
        if (!matched) {
            LogUtils.e(tag, "authorization failed: signature mismatch commandId=${command.commandId}")
        }
        return matched
    }

    private fun sendEvent(event: String, detail: String) {
        val config = currentConfig ?: return
        val json = JSONObject()
            .put("type", "event")
            .put("event", event)
            .put("detail", detail)
            .put("ts", System.currentTimeMillis())
            .put("deviceId", config.deviceId)
        socketClient.send(json.toString())
        LogUtils.i(tag, "event sent event=$event detail=$detail")
    }

    private fun buildNotification(): Notification {
        val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                getString(R.string.remote_service_title),
                NotificationManager.IMPORTANCE_LOW,
            )
            manager.createNotificationChannel(channel)
        }
        val openIntent = Intent(this, DJIAircraftMainActivity::class.java)
        val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        } else {
            PendingIntent.FLAG_UPDATE_CURRENT
        }
        val pendingIntent = PendingIntent.getActivity(this, 0, openIntent, flags)

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle(getString(R.string.remote_service_title))
            .setContentText(getString(R.string.remote_service_message))
            .setSmallIcon(R.mipmap.ic_main)
            .setOngoing(true)
            .setContentIntent(pendingIntent)
            .build()
    }

    private fun hmacSha256Hex(secret: String, payload: String): String {
        val mac = Mac.getInstance("HmacSHA256")
        val keySpec = SecretKeySpec(secret.toByteArray(StandardCharsets.UTF_8), "HmacSHA256")
        mac.init(keySpec)
        val bytes = mac.doFinal(payload.toByteArray(StandardCharsets.UTF_8))
        val builder = StringBuilder(bytes.size * 2)
        for (byte in bytes) {
            builder.append(String.format("%02x", byte))
        }
        return builder.toString()
    }

    companion object {
        private const val CHANNEL_ID = "remote_control_channel"
        private const val NOTIFICATION_ID = 9002
        private const val TELEMETRY_PERIOD_MS = 1000L
        private const val MAX_NONCE_CACHE = 512

        const val ACTION_START = "dji.sampleV5.aircraft.remote.action.START"
        const val ACTION_STOP = "dji.sampleV5.aircraft.remote.action.STOP"

        fun start(context: Context) {
            val intent = Intent(context, RemoteControlService::class.java).apply { action = ACTION_START }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }

        fun stop(context: Context) {
            context.stopService(Intent(context, RemoteControlService::class.java))
        }
    }
}
