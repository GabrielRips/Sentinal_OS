package dji.sampleV5.aircraft.remote

import dji.v5.utils.common.LogUtils
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import okhttp3.WebSocket
import okhttp3.WebSocketListener
import java.util.concurrent.Executors
import java.util.concurrent.ScheduledFuture
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicBoolean
import java.util.concurrent.atomic.AtomicInteger

class RemoteSocketClient(
    private val listener: Listener,
) {

    interface Listener {
        fun onConnected()
        fun onDisconnected(reason: String)
        fun onMessage(message: String)
    }

    private val tag = LogUtils.getTag("RemoteSocketClient")
    private val httpClient = OkHttpClient.Builder().retryOnConnectionFailure(true).build()
    private val reconnectExecutor = Executors.newSingleThreadScheduledExecutor()
    private val connected = AtomicBoolean(false)
    private val connectAttempt = AtomicInteger(0)

    @Volatile
    private var webSocket: WebSocket? = null

    @Volatile
    private var closedByUser = false

    @Volatile
    private var lastUrl: String = ""

    @Volatile
    private var lastDeviceId: String = ""

    @Volatile
    private var lastToken: String = ""

    @Volatile
    private var reconnectTask: ScheduledFuture<*>? = null

    fun connect(url: String, deviceId: String, token: String) {
        lastUrl = url
        lastDeviceId = deviceId
        lastToken = token
        closedByUser = false
        LogUtils.i(
            tag,
            "connect requested url=$url deviceId=$deviceId tokenPresent=${token.isNotBlank()}"
        )
        openSocket()
    }

    fun close() {
        LogUtils.i(tag, "close requested")
        closedByUser = true
        reconnectTask?.cancel(true)
        reconnectTask = null
        connected.set(false)
        webSocket?.close(CODE_NORMAL, "client_stop")
        webSocket = null
    }

    fun release() {
        LogUtils.i(tag, "release requested")
        close()
        reconnectExecutor.shutdownNow()
        httpClient.dispatcher.executorService.shutdown()
        httpClient.connectionPool.evictAll()
    }

    fun send(text: String) {
        if (!connected.get()) {
            LogUtils.i(tag, "send skipped because socket is disconnected")
        }
        webSocket?.send(text)
    }

    fun isConnected(): Boolean = connected.get()

    private fun openSocket() {
        if (lastUrl.isBlank()) {
            LogUtils.e(tag, "openSocket skipped: empty url")
            return
        }
        reconnectTask?.cancel(true)
        reconnectTask = null
        val attempt = connectAttempt.incrementAndGet()
        LogUtils.i(tag, "opening websocket attempt=$attempt url=$lastUrl deviceId=$lastDeviceId")
        val requestBuilder = Request.Builder()
            .url(lastUrl)
            .addHeader("X-Device-Id", lastDeviceId)
        if (lastToken.isNotBlank()) {
            requestBuilder.addHeader("Authorization", "Bearer $lastToken")
        }
        webSocket = httpClient.newWebSocket(requestBuilder.build(), object : WebSocketListener() {
            override fun onOpen(webSocket: WebSocket, response: Response) {
                connected.set(true)
                LogUtils.i(tag, "websocket connected code=${response.code}")
                listener.onConnected()
            }

            override fun onMessage(webSocket: WebSocket, text: String) {
                LogUtils.i(tag, "websocket message received chars=${text.length}")
                listener.onMessage(text)
            }

            override fun onClosing(webSocket: WebSocket, code: Int, reason: String) {
                connected.set(false)
                LogUtils.i(tag, "websocket closing code=$code reason=$reason")
                listener.onDisconnected("closing:$code:$reason")
                webSocket.close(code, reason)
                if (!closedByUser) {
                    scheduleReconnect()
                }
            }

            override fun onClosed(webSocket: WebSocket, code: Int, reason: String) {
                connected.set(false)
                LogUtils.i(tag, "websocket closed code=$code reason=$reason")
                listener.onDisconnected("closed:$code:$reason")
                if (!closedByUser) {
                    scheduleReconnect()
                }
            }

            override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
                connected.set(false)
                LogUtils.e(
                    tag,
                    "websocket failure message=${t.message} code=${response?.code}"
                )
                listener.onDisconnected("failure:${t.message}")
                if (!closedByUser) {
                    scheduleReconnect()
                }
            }
        })
    }

    private fun scheduleReconnect() {
        if (reconnectTask != null || closedByUser) {
            LogUtils.i(tag, "skip reconnect reconnectTask=${reconnectTask != null} closedByUser=$closedByUser")
            return
        }
        LogUtils.i(tag, "schedule reconnect in ${RECONNECT_DELAY_MS}ms")
        reconnectTask = reconnectExecutor.schedule({
            reconnectTask = null
            openSocket()
        }, RECONNECT_DELAY_MS, TimeUnit.MILLISECONDS)
    }

    companion object {
        private const val CODE_NORMAL = 1000
        private const val RECONNECT_DELAY_MS = 2000L
    }
}
