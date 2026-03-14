const http = require("http");
const crypto = require("crypto");
const express = require("express");
const WebSocket = require("ws");

const PORT = Number(process.env.PORT || 8080);
const DEVICE_TOKEN = process.env.DEVICE_TOKEN || "";
const API_KEY = process.env.API_KEY || "";
const SHARED_SECRET = process.env.SHARED_SECRET || "";
const LOG_RAW_MESSAGES = process.env.LOG_RAW_MESSAGES === "1";
const MAX_HISTORY = 200;

function nowIso() {
  return new Date().toISOString();
}

function logInfo(message, data) {
  if (data === undefined) {
    console.log(`[${nowIso()}] INFO ${message}`);
    return;
  }
  console.log(`[${nowIso()}] INFO ${message}`, data);
}

function logWarn(message, data) {
  if (data === undefined) {
    console.warn(`[${nowIso()}] WARN ${message}`);
    return;
  }
  console.warn(`[${nowIso()}] WARN ${message}`, data);
}

function logError(message, data) {
  if (data === undefined) {
    console.error(`[${nowIso()}] ERROR ${message}`);
    return;
  }
  console.error(`[${nowIso()}] ERROR ${message}`, data);
}

const app = express();
app.use(express.json({ limit: "1mb" }));

const clients = new Map();
const state = new Map();

function ensureState(deviceId) {
  if (!state.has(deviceId)) {
    state.set(deviceId, {
      telemetry: [],
      events: [],
      acks: [],
      commands: [],
      connectedAt: null,
      disconnectedAt: null,
      lastSeenAt: null
    });
  }
  return state.get(deviceId);
}

function pushBounded(list, item) {
  list.push(item);
  if (list.length > MAX_HISTORY) {
    list.shift();
  }
}

function parseDeviceId(req) {
  const url = new URL(req.url, "http://localhost");
  const parts = url.pathname.split("/").filter(Boolean);
  if (parts.length >= 3 && parts[0] === "ws" && parts[1] === "device") {
    return decodeURIComponent(parts[2]);
  }
  const headerId = req.headers["x-device-id"];
  if (typeof headerId === "string" && headerId.trim()) {
    return headerId.trim();
  }
  return "unknown-device";
}

function parseBearerToken(headerValue) {
  if (!headerValue || typeof headerValue !== "string") {
    return "";
  }
  const value = headerValue.trim();
  if (!value.startsWith("Bearer ")) {
    return "";
  }
  return value.slice("Bearer ".length).trim();
}

function verifyDeviceAuth(req) {
  if (!DEVICE_TOKEN) {
    return true;
  }
  const bearer = parseBearerToken(req.headers.authorization);
  return bearer === DEVICE_TOKEN;
}

function verifyApiAuth(req, res, next) {
  if (!API_KEY) {
    next();
    return;
  }
  const key = req.header("x-api-key") || "";
  if (key !== API_KEY) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }
  next();
}

function signCommand(command) {
  if (!SHARED_SECRET) {
    return "";
  }
  const payloadRaw = JSON.stringify(command.payload || {});
  const data = `${command.commandId}|${command.name}|${command.ts}|${command.nonce}|${payloadRaw}`;
  return crypto.createHmac("sha256", SHARED_SECRET).update(data, "utf8").digest("hex");
}

function buildCommand({ name, payload = {}, ttlMs = 5000, commandId, nonce }) {
  const command = {
    type: "command",
    commandId: commandId || crypto.randomUUID(),
    name,
    ts: Date.now(),
    ttlMs,
    nonce: nonce || crypto.randomUUID(),
    payload
  };
  command.signature = signCommand(command);
  return command;
}

function sendToDevice(deviceId, command) {
  const ws = clients.get(deviceId);
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    logWarn("command send failed: device offline", {
      deviceId,
      commandId: command.commandId,
      name: command.name
    });
    return { ok: false, error: "device offline" };
  }
  ws.send(JSON.stringify(command));
  logInfo("command sent to device", {
    deviceId,
    commandId: command.commandId,
    name: command.name,
    ttlMs: command.ttlMs
  });
  const deviceState = ensureState(deviceId);
  pushBounded(deviceState.commands, {
    ...command,
    sentAt: Date.now()
  });
  return { ok: true };
}

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    connectedDevices: clients.size,
    uptimeSec: Math.round(process.uptime())
  });
});

app.get("/devices", verifyApiAuth, (_req, res) => {
  const devices = Array.from(new Set([...state.keys(), ...clients.keys()])).map((deviceId) => {
    const s = ensureState(deviceId);
    const ws = clients.get(deviceId);
    return {
      deviceId,
      connected: !!ws && ws.readyState === WebSocket.OPEN,
      connectedAt: s.connectedAt,
      disconnectedAt: s.disconnectedAt,
      lastSeenAt: s.lastSeenAt
    };
  });
  res.json({ devices });
});

app.get("/devices/:deviceId/state", verifyApiAuth, (req, res) => {
  const { deviceId } = req.params;
  const s = ensureState(deviceId);
  const ws = clients.get(deviceId);
  res.json({
    deviceId,
    connected: !!ws && ws.readyState === WebSocket.OPEN,
    connectedAt: s.connectedAt,
    disconnectedAt: s.disconnectedAt,
    lastSeenAt: s.lastSeenAt,
    telemetry: s.telemetry,
    events: s.events,
    acks: s.acks,
    commands: s.commands
  });
});

app.post("/devices/:deviceId/commands", verifyApiAuth, (req, res) => {
  const { deviceId } = req.params;
  const { name, payload, ttlMs, commandId, nonce } = req.body || {};
  logInfo("http command request", { deviceId, name, ttlMs });

  if (!name || typeof name !== "string") {
    res.status(400).json({ error: "name is required" });
    return;
  }

  const command = buildCommand({
    name,
    payload: payload && typeof payload === "object" ? payload : {},
    ttlMs: Number(ttlMs || 5000),
    commandId,
    nonce
  });

  const result = sendToDevice(deviceId, command);
  if (!result.ok) {
    res.status(409).json({ error: result.error });
    return;
  }

  res.json({ ok: true, command });
});

app.post("/devices/:deviceId/sticks", verifyApiAuth, (req, res) => {
  const { deviceId } = req.params;
  logInfo("http sticks request", {
    deviceId,
    leftHorizontal: Number(req.body?.leftHorizontal || 0),
    leftVertical: Number(req.body?.leftVertical || 0),
    rightHorizontal: Number(req.body?.rightHorizontal || 0),
    rightVertical: Number(req.body?.rightVertical || 0)
  });
  const payload = {
    leftHorizontal: Number(req.body?.leftHorizontal || 0),
    leftVertical: Number(req.body?.leftVertical || 0),
    rightHorizontal: Number(req.body?.rightHorizontal || 0),
    rightVertical: Number(req.body?.rightVertical || 0)
  };
  const command = buildCommand({ name: "SET_STICKS", payload, ttlMs: Number(req.body?.ttlMs || 1500) });
  const result = sendToDevice(deviceId, command);
  if (!result.ok) {
    res.status(409).json({ error: result.error });
    return;
  }
  res.json({ ok: true, command });
});

const server = http.createServer(app);
const wss = new WebSocket.Server({ noServer: true });

server.on("upgrade", (req, socket, head) => {
  logInfo("upgrade request", {
    url: req.url,
    remoteAddress: req.socket.remoteAddress,
    userAgent: req.headers["user-agent"] || ""
  });
  if (!req.url.startsWith("/ws/")) {
    logWarn("upgrade rejected: invalid ws path", { url: req.url });
    socket.destroy();
    return;
  }

  if (!verifyDeviceAuth(req)) {
    logWarn("upgrade rejected: auth failed", {
      url: req.url,
      remoteAddress: req.socket.remoteAddress
    });
    socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
    socket.destroy();
    return;
  }

  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit("connection", ws, req);
  });
});

wss.on("connection", (ws, req) => {
  const deviceId = parseDeviceId(req);
  logInfo("device websocket connected", {
    deviceId,
    remoteAddress: req.socket.remoteAddress,
    authHeaderPresent: !!req.headers.authorization
  });
  const existing = clients.get(deviceId);
  if (existing && existing.readyState === WebSocket.OPEN) {
    logWarn("closing previous connection for device", { deviceId });
    existing.close(4000, "superseded by newer connection");
  }
  clients.set(deviceId, ws);

  const s = ensureState(deviceId);
  s.connectedAt = Date.now();
  s.lastSeenAt = Date.now();

  ws.send(JSON.stringify({ type: "welcome", ts: Date.now(), deviceId }));

  ws.on("message", (raw) => {
    s.lastSeenAt = Date.now();
    let msg;
    try {
      msg = JSON.parse(raw.toString("utf8"));
    } catch (_error) {
      logWarn("invalid JSON from device", { deviceId, size: raw.length || 0 });
      return;
    }

    const type = String(msg.type || "").toLowerCase();
    if (LOG_RAW_MESSAGES) {
      logInfo("ws message", { deviceId, type, raw: msg });
    } else {
      logInfo("ws message", { deviceId, type });
    }
    if (type === "telemetry") {
      pushBounded(s.telemetry, msg);
      return;
    }
    if (type === "event") {
      pushBounded(s.events, msg);
      return;
    }
    if (type === "ack") {
      pushBounded(s.acks, msg);
      return;
    }
    if (type === "pong") {
      return;
    }
    logWarn("unknown ws message type", { deviceId, type });
  });

  ws.on("close", (code, reason) => {
    logInfo("device websocket closed", {
      deviceId,
      code,
      reason: reason ? reason.toString() : ""
    });
    if (clients.get(deviceId) === ws) {
      clients.delete(deviceId);
    }
    const current = ensureState(deviceId);
    current.disconnectedAt = Date.now();
  });

  ws.on("error", (error) => {
    logError("device websocket error", {
      deviceId,
      error: error?.message || String(error)
    });
  });
});

server.listen(PORT, () => {
  logInfo(`listening on :${PORT}`);
  logInfo(`ws endpoint: ws://localhost:${PORT}/ws/device/<deviceId>`);
  logInfo("config", {
    deviceTokenEnabled: !!DEVICE_TOKEN,
    apiKeyEnabled: !!API_KEY,
    sharedSecretEnabled: !!SHARED_SECRET,
    logRawMessages: LOG_RAW_MESSAGES
  });
});
