package dji.sampleV5.aircraft.remote

import dji.sdk.keyvalue.key.FlightControllerKey
import dji.sdk.keyvalue.value.common.EmptyMsg
import dji.sdk.keyvalue.value.common.LocationCoordinate3D
import dji.v5.common.callback.CommonCallbacks
import dji.v5.common.error.IDJIError
import dji.v5.et.action
import dji.v5.et.create
import dji.v5.et.get
import dji.v5.manager.SDKManager
import dji.v5.manager.aircraft.virtualstick.Stick
import dji.v5.manager.aircraft.virtualstick.VirtualStickManager
import dji.v5.utils.common.LogUtils
import java.util.concurrent.CountDownLatch
import java.util.concurrent.Executors
import java.util.concurrent.ScheduledFuture
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicBoolean
import java.util.concurrent.atomic.AtomicLong
import java.util.concurrent.atomic.AtomicReference
import java.lang.reflect.Method

class RemoteCommandExecutor {

    private val tag = LogUtils.getTag("RemoteCommandExecutor")
    private val remoteArmed = AtomicBoolean(false)
    private val virtualStickEnabled = AtomicBoolean(false)
    private val lastCommandAt = AtomicLong(0L)
    private val lastStickAt = AtomicLong(0L)
    private val lastError = AtomicReference("")
    private val watchdogExecutor = Executors.newSingleThreadScheduledExecutor()
    private var watchdogTask: ScheduledFuture<*>? = null

    fun start() {
        if (watchdogTask != null) {
            LogUtils.i(tag, "watchdog already started")
            return
        }
        LogUtils.i(tag, "start watchdog")
        watchdogTask = watchdogExecutor.scheduleAtFixedRate({
            if (!remoteArmed.get()) {
                return@scheduleAtFixedRate
            }
            val now = System.currentTimeMillis()
            if (now - lastStickAt.get() > STICK_DEADMAN_TIMEOUT_MS) {
                LogUtils.i(tag, "deadman triggered, neutralizing sticks")
                neutralizeSticks()
            }
        }, 100, 100, TimeUnit.MILLISECONDS)
    }

    fun stop() {
        LogUtils.i(tag, "stop watchdog and disarm")
        remoteArmed.set(false)
        neutralizeSticks()
        watchdogTask?.cancel(true)
        watchdogTask = null
    }

    fun destroy() {
        stop()
        watchdogExecutor.shutdownNow()
    }

    fun execute(command: RemoteCommand): RemoteAck {
        lastCommandAt.set(System.currentTimeMillis())
        val cmd = command.name.trim().uppercase()
        LogUtils.i(tag, "execute command id=${command.commandId} name=$cmd")
        return try {
            when (cmd) {
                "ARM_REMOTE" -> {
                    remoteArmed.set(true)
                    lastStickAt.set(System.currentTimeMillis())
                    RemoteAck(command.commandId, true, "remote armed")
                }

                "DISARM_REMOTE" -> {
                    remoteArmed.set(false)
                    neutralizeSticks()
                    RemoteAck(command.commandId, true, "remote disarmed")
                }

                "ENABLE_VIRTUAL_STICK" -> {
                    if (!ensureCanControl()) {
                        return failAck(command, "aircraft not controllable")
                    }
                    val result = awaitCompletion {
                        VirtualStickManager.getInstance().enableVirtualStick(it)
                    }
                    if (result.first) {
                        virtualStickEnabled.set(true)
                        okAck(command, "virtual stick enabled")
                    } else {
                        failAck(command, result.second)
                    }
                }

                "DISABLE_VIRTUAL_STICK" -> {
                    val result = awaitCompletion {
                        VirtualStickManager.getInstance().disableVirtualStick(it)
                    }
                    if (result.first) {
                        virtualStickEnabled.set(false)
                        okAck(command, "virtual stick disabled")
                    } else {
                        failAck(command, result.second)
                    }
                }

                "SET_SPEED_LEVEL" -> {
                    val speed = command.payload.optDouble("speedLevel", -1.0)
                    if (speed <= 0.0 || speed > 1.0) {
                        return failAck(command, "speedLevel must be in (0,1]")
                    }
                    VirtualStickManager.getInstance().speedLevel = speed
                    okAck(command, "speed level updated")
                }

                "SET_STICKS" -> {
                    if (!remoteArmed.get()) {
                        return failAck(command, "remote not armed")
                    }
                    if (!virtualStickEnabled.get()) {
                        return failAck(command, "virtual stick is not enabled")
                    }
                    val leftH = clampStick(command.payload.optInt("leftHorizontal", 0))
                    val leftV = clampStick(command.payload.optInt("leftVertical", 0))
                    val rightH = clampStick(command.payload.optInt("rightHorizontal", 0))
                    val rightV = clampStick(command.payload.optInt("rightVertical", 0))
                    VirtualStickManager.getInstance().leftStick.horizontalPosition = leftH
                    VirtualStickManager.getInstance().leftStick.verticalPosition = leftV
                    VirtualStickManager.getInstance().rightStick.horizontalPosition = rightH
                    VirtualStickManager.getInstance().rightStick.verticalPosition = rightV
                    lastStickAt.set(System.currentTimeMillis())
                    okAck(command, "stick update applied")
                }

                "HOVER" -> {
                    neutralizeSticks()
                    lastStickAt.set(System.currentTimeMillis())
                    okAck(command, "hover command applied")
                }

                "HEARTBEAT" -> {
                    lastStickAt.set(System.currentTimeMillis())
                    okAck(command, "heartbeat accepted")
                }

                "TAKEOFF" -> {
                    if (!remoteArmed.get() || !ensureCanControl()) {
                        return failAck(command, "takeoff blocked by safety gate")
                    }
                    val result = awaitParamCompletion {
                        FlightControllerKey.KeyStartTakeoff.create().action({ value ->
                            it.onSuccess(value)
                        }, { error ->
                            it.onFailure(error)
                        })
                    }
                    if (result.first) okAck(command, "takeoff started") else failAck(command, result.second)
                }

                "TAKEOFF_TO_HEIGHT" -> {
                    if (!remoteArmed.get() || !ensureCanControl()) {
                        return failAck(command, "takeoff_to_height blocked by safety gate")
                    }
                    val targetHeight = parseTargetTakeoffHeight(command)
                        ?: return failAck(command, "target height must be a valid number in [0.75, 30.0] meters")
                    val result = executeTakeoffToHeight(targetHeight)
                    if (result.first) okAck(command, result.second) else failAck(command, result.second)
                }

                "LAND" -> {
                    if (!remoteArmed.get() || !ensureCanControl()) {
                        return failAck(command, "landing blocked by safety gate")
                    }
                    val result = awaitParamCompletion {
                        FlightControllerKey.KeyStartAutoLanding.create().action({ value ->
                            it.onSuccess(value)
                        }, { error ->
                            it.onFailure(error)
                        })
                    }
                    if (result.first) okAck(command, "landing started") else failAck(command, result.second)
                }

                else -> failAck(command, "unsupported command:${command.name}")
            }
        } catch (e: Exception) {
            LogUtils.e(tag, "command execution exception id=${command.commandId} message=${e.message}")
            failAck(command, e.message ?: "execution error")
        }
    }

    fun isRemoteArmed(): Boolean = remoteArmed.get()

    fun isVirtualStickEnabled(): Boolean {
        val realtime = readVirtualStickEnabledFromManager()
        if (realtime != null) {
            if (realtime != virtualStickEnabled.get()) {
                LogUtils.i(tag, "virtual stick realtime state changed to $realtime")
            }
            virtualStickEnabled.set(realtime)
            return realtime
        }
        return virtualStickEnabled.get()
    }

    fun getLastCommandAt(): Long = lastCommandAt.get()

    fun getLastError(): String = lastError.get()

    fun isAircraftConnected(): Boolean {
        val latch = CountDownLatch(1)
        val connectedRef = AtomicBoolean(false)
        FlightControllerKey.KeyConnection.create().get({ connected ->
            connectedRef.set(connected == true)
            latch.countDown()
        }) {
            latch.countDown()
        }
        latch.await(1200, TimeUnit.MILLISECONDS)
        return connectedRef.get()
    }

    private fun ensureCanControl(): Boolean {
        if (!SDKManager.getInstance().isRegistered) {
            LogUtils.e(tag, "control blocked: SDK not registered")
            return false
        }
        val connected = isAircraftConnected()
        if (!connected) {
            LogUtils.e(tag, "control blocked: aircraft not connected")
        }
        return connected
    }

    private fun neutralizeSticks() {
        VirtualStickManager.getInstance().leftStick.horizontalPosition = 0
        VirtualStickManager.getInstance().leftStick.verticalPosition = 0
        VirtualStickManager.getInstance().rightStick.horizontalPosition = 0
        VirtualStickManager.getInstance().rightStick.verticalPosition = 0
    }

    private fun awaitCompletion(block: (CommonCallbacks.CompletionCallback) -> Unit): Pair<Boolean, String> {
        val latch = CountDownLatch(1)
        val ok = AtomicBoolean(false)
        val errorMsg = AtomicReference("")
        block.invoke(object : CommonCallbacks.CompletionCallback {
            override fun onSuccess() {
                ok.set(true)
                latch.countDown()
            }

            override fun onFailure(error: IDJIError) {
                errorMsg.set(error.toString())
                latch.countDown()
            }
        })
        latch.await(5, TimeUnit.SECONDS)
        return Pair(ok.get(), errorMsg.get())
    }

    private fun awaitParamCompletion(block: (CommonCallbacks.CompletionCallbackWithParam<EmptyMsg>) -> Unit): Pair<Boolean, String> {
        val latch = CountDownLatch(1)
        val ok = AtomicBoolean(false)
        val errorMsg = AtomicReference("")
        block.invoke(object : CommonCallbacks.CompletionCallbackWithParam<EmptyMsg> {
            override fun onSuccess(t: EmptyMsg?) {
                ok.set(true)
                latch.countDown()
            }

            override fun onFailure(error: IDJIError) {
                errorMsg.set(error.toString())
                latch.countDown()
            }
        })
        latch.await(5, TimeUnit.SECONDS)
        return Pair(ok.get(), errorMsg.get())
    }

    private fun parseTargetTakeoffHeight(command: RemoteCommand): Double? {
        val payload = command.payload
        val target = when {
            payload.has("targetHeightMeters") -> payload.optDouble("targetHeightMeters", Double.NaN)
            payload.has("heightMeters") -> payload.optDouble("heightMeters", Double.NaN)
            payload.has("targetHeight") -> payload.optDouble("targetHeight", Double.NaN)
            else -> DEFAULT_TAKEOFF_TARGET_HEIGHT_M
        }
        if (!target.isFinite()) {
            return null
        }
        if (target < MIN_TAKEOFF_TARGET_HEIGHT_M || target > MAX_TAKEOFF_TARGET_HEIGHT_M) {
            return null
        }
        return target
    }

    private fun executeTakeoffToHeight(targetHeightMeters: Double): Pair<Boolean, String> {
        val startAltitudeResult = getAircraftAltitudeMeters()
        if (!startAltitudeResult.first) {
            return Pair(false, "failed to read altitude before takeoff")
        }
        val takeoffResult = awaitParamCompletion {
            FlightControllerKey.KeyStartTakeoff.create().action({ value ->
                it.onSuccess(value)
            }, { error ->
                it.onFailure(error)
            })
        }
        if (!takeoffResult.first) {
            return takeoffResult
        }
        val virtualStickResult = awaitCompletion {
            VirtualStickManager.getInstance().enableVirtualStick(it)
        }
        if (!virtualStickResult.first) {
            return Pair(false, "takeoff started but failed to enable virtual stick: ${virtualStickResult.second}")
        }
        virtualStickEnabled.set(true)
        val deadline = System.currentTimeMillis() + TAKEOFF_TO_HEIGHT_TIMEOUT_MS
        while (System.currentTimeMillis() < deadline) {
            if (!remoteArmed.get()) {
                neutralizeSticks()
                return Pair(false, "aborted because remote was disarmed")
            }
            val altitudeResult = getAircraftAltitudeMeters()
            if (!altitudeResult.first) {
                Thread.sleep(TAKEOFF_CONTROL_INTERVAL_MS)
                continue
            }
            val climbedMeters = altitudeResult.second - startAltitudeResult.second
            if (climbedMeters >= targetHeightMeters - TAKEOFF_TARGET_TOLERANCE_M) {
                neutralizeSticks()
                return Pair(true, "takeoff reached %.2fm".format(climbedMeters))
            }
            VirtualStickManager.getInstance().leftStick.horizontalPosition = 0
            VirtualStickManager.getInstance().leftStick.verticalPosition = TAKEOFF_ASCENT_STICK
            VirtualStickManager.getInstance().rightStick.horizontalPosition = 0
            VirtualStickManager.getInstance().rightStick.verticalPosition = 0
            lastStickAt.set(System.currentTimeMillis())
            Thread.sleep(TAKEOFF_CONTROL_INTERVAL_MS)
        }
        neutralizeSticks()
        return Pair(false, "timeout before reaching target takeoff height")
    }

    private fun getAircraftAltitudeMeters(): Pair<Boolean, Double> {
        val latch = CountDownLatch(1)
        val altitudeRef = AtomicReference<Double?>(null)
        FlightControllerKey.KeyAircraftLocation3D.create().get({ location: LocationCoordinate3D? ->
            altitudeRef.set(location?.altitude)
            latch.countDown()
        }) {
            latch.countDown()
        }
        latch.await(1200, TimeUnit.MILLISECONDS)
        val altitude = altitudeRef.get() ?: return Pair(false, 0.0)
        return Pair(true, altitude)
    }

    private fun okAck(command: RemoteCommand, message: String): RemoteAck {
        lastError.set("")
        LogUtils.i(tag, "command success id=${command.commandId} message=$message")
        return RemoteAck(command.commandId, true, message)
    }

    private fun failAck(command: RemoteCommand, message: String): RemoteAck {
        lastError.set(message)
        LogUtils.e(tag, "command failed id=${command.commandId} message=$message")
        return RemoteAck(command.commandId, false, message)
    }

    private fun clampStick(value: Int): Int {
        return value.coerceIn(-Stick.MAX_STICK_POSITION_ABS, Stick.MAX_STICK_POSITION_ABS)
    }

    private fun readVirtualStickEnabledFromManager(): Boolean? {
        val manager = VirtualStickManager.getInstance()
        invokeBooleanGetter(manager, listOf("isVirtualStickEnabled", "getVirtualStickEnabled"))?.let {
            return it
        }

        val stateSources = mutableListOf<Any>()
        stateSources.add(manager)

        val stateMethod = findNoArgMethod(
            manager.javaClass,
            listOf("getVirtualStickState", "getCurrentVirtualStickState", "getState")
        )
        if (stateMethod != null) {
            runCatching {
                val state = stateMethod.invoke(manager)
                if (state != null) {
                    stateSources.add(state)
                }
            }.onFailure {
                LogUtils.i(tag, "read virtual stick state method failed:${it.message}")
            }
        }

        runCatching {
            val field = manager.javaClass.declaredFields.firstOrNull {
                it.name.equals("virtualStickState", true) || it.name.equals("state", true)
            }
            if (field != null) {
                field.isAccessible = true
                val value = field.get(manager)
                if (value != null) {
                    stateSources.add(value)
                }
            }
        }.onFailure {
            LogUtils.i(tag, "read virtual stick state field failed:${it.message}")
        }

        for (source in stateSources) {
            invokeBooleanGetter(
                source,
                listOf(
                    "isVirtualStickEnable",
                    "isVirtualStickEnabled",
                    "getVirtualStickEnable",
                    "getVirtualStickEnabled"
                )
            )?.let {
                return it
            }
        }
        return null
    }

    private fun invokeBooleanGetter(target: Any, methodNames: List<String>): Boolean? {
        for (methodName in methodNames) {
            val method = findNoArgMethod(target.javaClass, listOf(methodName)) ?: continue
            runCatching {
                val value = method.invoke(target)
                when (value) {
                    is Boolean -> value
                    else -> null
                }
            }.getOrNull()?.let {
                return it
            }
        }
        return null
    }

    private fun findNoArgMethod(clazz: Class<*>, methodNames: List<String>): Method? {
        for (name in methodNames) {
            clazz.methods.firstOrNull { it.name == name && it.parameterCount == 0 }?.let {
                return it
            }
        }
        return null
    }

    companion object {
        private const val STICK_DEADMAN_TIMEOUT_MS = 500L
        private const val TAKEOFF_TO_HEIGHT_TIMEOUT_MS = 30_000L
        private const val TAKEOFF_CONTROL_INTERVAL_MS = 100L
        private const val TAKEOFF_ASCENT_STICK = 220
        private const val TAKEOFF_TARGET_TOLERANCE_M = 0.08
        private const val MIN_TAKEOFF_TARGET_HEIGHT_M = 0.75
        private const val MAX_TAKEOFF_TARGET_HEIGHT_M = 30.0
        private const val DEFAULT_TAKEOFF_TARGET_HEIGHT_M = 0.75
    }
}
