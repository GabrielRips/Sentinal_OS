package dji.sampleV5.aircraft.remote

import org.json.JSONObject

data class RemoteCommand(
    val commandId: String,
    val name: String,
    val timestampMs: Long,
    val ttlMs: Long,
    val nonce: String,
    val signature: String,
    val payload: JSONObject,
    val payloadRaw: String,
) {
    companion object {
        fun fromJson(json: JSONObject): RemoteCommand {
            val payloadObj = json.optJSONObject("payload") ?: JSONObject()
            return RemoteCommand(
                commandId = json.optString("commandId", json.optString("id", "")),
                name = json.optString("name", json.optString("command", "")),
                timestampMs = json.optLong("ts", System.currentTimeMillis()),
                ttlMs = json.optLong("ttlMs", 5000L),
                nonce = json.optString("nonce", json.optString("commandId", "")),
                signature = json.optString("signature", ""),
                payload = payloadObj,
                payloadRaw = payloadObj.toString(),
            )
        }
    }
}

data class RemoteAck(
    val commandId: String,
    val success: Boolean,
    val message: String,
    val timestampMs: Long = System.currentTimeMillis(),
) {
    fun toJson(): String {
        return JSONObject()
            .put("type", "ack")
            .put("commandId", commandId)
            .put("success", success)
            .put("message", message)
            .put("ts", timestampMs)
            .toString()
    }
}
