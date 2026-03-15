const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const DEFAULT_MODEL = process.env.AGENT_MODEL || "gpt-4.1-mini";
const DEFAULT_BASE_URL = process.env.AGENT_SERVER_BASE_URL || "http://localhost:8080";
const DEFAULT_DEVICE_ID = process.env.AGENT_DEVICE_ID || "uav-01";
const DEFAULT_ITERATIONS = Number(process.env.AGENT_MAX_ITERATIONS || 10);
const DEFAULT_LOG_DIR = process.env.AGENT_LOG_DIR || "./agent-logs";
const DEFAULT_DEMO_STEP_DELAY_MS = Number(process.env.AGENT_DEMO_STEP_DELAY_MS || 850);
const DEFAULT_DEMO_ACTION_DELAY_MS = Number(process.env.AGENT_DEMO_ACTION_DELAY_MS || 1300);

const EXECUTE_ENABLED = process.env.AGENT_EXECUTE === "1";
const SIMULATOR_ONLY = process.env.AGENT_SIMULATOR_ONLY !== "0";

function nowIso() {
  return new Date().toISOString();
}

function waitMs(ms) {
  return new Promise((resolve) => setTimeout(resolve, Math.max(0, Number(ms) || 0)));
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Number(value || 0)));
}

function parseArgs(argv) {
  const context = createContext({
    goal: process.env.AGENT_GOAL || "Go closer to the tennis balls.",
    model: DEFAULT_MODEL,
    baseUrl: DEFAULT_BASE_URL,
    deviceId: DEFAULT_DEVICE_ID,
    maxIterations: DEFAULT_ITERATIONS
  });

  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--goal") {
      context.goal = argv[i + 1] || context.goal;
      i += 1;
      continue;
    }
    if (arg === "--device") {
      context.deviceId = argv[i + 1] || context.deviceId;
      i += 1;
      continue;
    }
    if (arg === "--model") {
      context.model = argv[i + 1] || context.model;
      i += 1;
      continue;
    }
    if (arg === "--base-url") {
      context.baseUrl = argv[i + 1] || context.baseUrl;
      i += 1;
      continue;
    }
  }

  return context;
}

function createContext(input = {}) {
  return {
    goal: typeof input.goal === "string" ? input.goal : "Go closer to the tennis balls.",
    model: typeof input.model === "string" ? input.model : DEFAULT_MODEL,
    baseUrl: typeof input.baseUrl === "string" ? input.baseUrl : DEFAULT_BASE_URL,
    deviceId: typeof input.deviceId === "string" ? input.deviceId : DEFAULT_DEVICE_ID,
    maxIterations: Number(input.maxIterations || DEFAULT_ITERATIONS),
    capturePath: process.env.AGENT_CAPTURE_PATH || "./agent-logs/latest-frame.jpg",
    stepDelayMs: DEFAULT_DEMO_STEP_DELAY_MS,
    actionDelayMs: DEFAULT_DEMO_ACTION_DELAY_MS
  };
}

function createHttpClient(baseUrl) {
  const apiKey = process.env.API_KEY || "";
  const normalized = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;

  async function request(method, urlPath, body) {
    const headers = { "Content-Type": "application/json" };
    if (apiKey) {
      headers["x-api-key"] = apiKey;
    }

    const response = await fetch(`${normalized}${urlPath}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body)
    });
    const text = await response.text();
    let payload = {};
    try {
      payload = text ? JSON.parse(text) : {};
    } catch (_err) {
      payload = { raw: text };
    }
    if (!response.ok) {
      throw new Error(`HTTP ${method} ${urlPath} failed: ${payload.error || `${response.status} ${response.statusText}`}`);
    }
    return payload;
  }

  return {
    get(urlPath) {
      return request("GET", urlPath);
    },
    post(urlPath, body) {
      return request("POST", urlPath, body);
    }
  };
}

function latestTelemetry(deviceState) {
  const telemetry = deviceState && Array.isArray(deviceState.telemetry) ? deviceState.telemetry : [];
  return telemetry.length ? telemetry[telemetry.length - 1] : null;
}

function extractGps(telemetry) {
  if (!telemetry || typeof telemetry !== "object") {
    return null;
  }
  const candidates = [
    [telemetry.latitude, telemetry.longitude],
    [telemetry.lat, telemetry.lng],
    [telemetry.lat, telemetry.lon],
    [telemetry.location && telemetry.location.latitude, telemetry.location && telemetry.location.longitude]
  ];

  for (const pair of candidates) {
    if (Number.isFinite(pair[0]) && Number.isFinite(pair[1])) {
      return { latitude: Number(pair[0]), longitude: Number(pair[1]) };
    }
  }
  return null;
}

function ensureDirFor(filePath) {
  fs.mkdirSync(path.dirname(path.resolve(filePath)), { recursive: true });
}

function captureRtmpFrame(url, outPath) {
  return new Promise((resolve) => {
    if (!url) {
      resolve({ ok: false, error: "AGENT_RTMP_URL is not set" });
      return;
    }
    ensureDirFor(outPath);
    const ffmpegPath = process.env.AGENT_FFMPEG_PATH || "ffmpeg";
    const args = [
      "-y",
      "-rtmp_live",
      "live",
      "-i",
      url,
      "-frames:v",
      "1",
      "-q:v",
      "3",
      outPath
    ];
    const child = spawn(ffmpegPath, args, { stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";
    const timer = setTimeout(() => child.kill("SIGKILL"), 7500);
    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });
    child.on("error", (error) => {
      clearTimeout(timer);
      resolve({ ok: false, error: `ffmpeg spawn failed: ${error.message}` });
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code !== 0) {
        resolve({ ok: false, error: `ffmpeg exited with code ${code}`, detail: stderr.slice(-300) });
        return;
      }
      resolve({ ok: true, path: outPath });
    });
  });
}

function buildToolRunner(context) {
  const http = createHttpClient(context.baseUrl);

  return async function runTool(toolName, args) {
    const deviceId = args.deviceId || context.deviceId;
    if (toolName === "get_device_state") {
      return http.get(`/devices/${encodeURIComponent(deviceId)}/state`);
    }

    if (toolName === "get_current_gps") {
      const state = await http.get(`/devices/${encodeURIComponent(deviceId)}/state`);
      const telemetry = latestTelemetry(state);
      const gps = extractGps(telemetry);
      return {
        ok: !!gps,
        gps,
        telemetryTs: telemetry && telemetry.ts ? telemetry.ts : null,
        note: gps ? "GPS extracted from telemetry" : "GPS unavailable in telemetry"
      };
    }

    if (toolName === "search_poi") {
      const query = String(args.query || "tennis ball");
      const latitude = Number(args.latitude);
      const longitude = Number(args.longitude);
      const limit = clamp(args.limit || 3, 1, 8);
      const u = new URL("https://nominatim.openstreetmap.org/search");
      u.searchParams.set("q", query);
      u.searchParams.set("format", "jsonv2");
      u.searchParams.set("limit", String(limit));
      u.searchParams.set("viewbox", `${longitude - 0.04},${latitude + 0.04},${longitude + 0.04},${latitude - 0.04}`);
      u.searchParams.set("bounded", "1");
      const response = await fetch(u, { headers: { "User-Agent": "Sentinal-DroneAgent/0.1" } });
      if (!response.ok) {
        throw new Error(`POI search failed: ${response.status} ${response.statusText}`);
      }
      const rows = await response.json();
      return {
        ok: true,
        query,
        results: (Array.isArray(rows) ? rows : []).map((row) => ({
          displayName: row.display_name,
          latitude: Number(row.lat),
          longitude: Number(row.lon)
        }))
      };
    }

    if (toolName === "capture_rtmp_frame") {
      return captureRtmpFrame(process.env.AGENT_RTMP_URL || "", args.outPath || context.capturePath);
    }

    if (toolName === "analyze_frame") {
      if (!args.framePath) {
        return { ok: false, error: "framePath is required" };
      }
      return {
        ok: true,
        model: "demo-vision",
        target: "tennis_ball",
        confidence: 0.82,
        centerOffset: { x: 0.18, y: 0.06 },
        apparentSize: 0.22,
        note: "Demo analysis: tennis ball detected slightly right, still far"
      };
    }

    if (toolName === "estimate_target_offset") {
      const analysis = args.analysis || {};
      const x = Number(analysis.centerOffset && analysis.centerOffset.x);
      const y = Number(analysis.centerOffset && analysis.centerOffset.y);
      const size = Number(analysis.apparentSize || 0);
      return {
        ok: true,
        lateralBias: Number.isFinite(x) ? x : 0,
        verticalBias: Number.isFinite(y) ? y : 0,
        nearEnough: size >= 0.4,
        progress: size
      };
    }

    if (toolName === "generate_action_candidates") {
      const offset = args.offset || {};
      const x = clamp(offset.lateralBias || 0, -1, 1);
      const nearEnough = !!offset.nearEnough;
      const baseForward = nearEnough ? 0 : 90;
      return {
        ok: true,
        candidates: [
          {
            name: "move_forward_small",
            sticks: {
              leftHorizontal: 0,
              leftVertical: baseForward,
              rightHorizontal: Math.round(x * 70),
              rightVertical: 0
            },
            score: nearEnough ? 0.35 : 0.91
          },
          {
            name: "hover",
            sticks: { leftHorizontal: 0, leftVertical: 0, rightHorizontal: 0, rightVertical: 0 },
            score: nearEnough ? 0.95 : 0.5
          }
        ]
      };
    }

    if (toolName === "safety_filter_actions") {
      const candidates = Array.isArray(args.candidates) ? args.candidates : [];
      const selected = candidates.length ? candidates[0] : { sticks: {} };
      const s = selected.sticks || {};
      return {
        ok: true,
        selected: {
          name: selected.name || "hover",
          sticks: {
            leftHorizontal: clamp(s.leftHorizontal || 0, -220, 220),
            leftVertical: clamp(s.leftVertical || 0, -220, 220),
            rightHorizontal: clamp(s.rightHorizontal || 0, -220, 220),
            rightVertical: clamp(s.rightVertical || 0, -220, 220)
          },
          ttlMs: 1200
        }
      };
    }

    if (toolName === "send_drone_command") {
      const body = {
        name: String(args.name || "").toUpperCase(),
        payload: args.payload && typeof args.payload === "object" ? args.payload : {},
        ttlMs: clamp(args.ttlMs || 5000, 500, 60000)
      };
      if (SIMULATOR_ONLY && process.env.DJI_AIRCRAFT_MODE === "real") {
        return { ok: false, error: "simulator-only mode blocks real aircraft actions" };
      }
      if (!EXECUTE_ENABLED) {
        return { ok: true, dryRun: true, action: "send_drone_command", body };
      }
      return http.post(`/devices/${encodeURIComponent(deviceId)}/commands`, body);
    }

    if (toolName === "set_virtual_sticks") {
      const body = {
        leftHorizontal: clamp(args.leftHorizontal || 0, -660, 660),
        leftVertical: clamp(args.leftVertical || 0, -660, 660),
        rightHorizontal: clamp(args.rightHorizontal || 0, -660, 660),
        rightVertical: clamp(args.rightVertical || 0, -660, 660),
        ttlMs: clamp(args.ttlMs || 1200, 300, 2500)
      };
      if (SIMULATOR_ONLY && process.env.DJI_AIRCRAFT_MODE === "real") {
        return { ok: false, error: "simulator-only mode blocks real aircraft actions" };
      }
      if (!EXECUTE_ENABLED) {
        return { ok: true, dryRun: true, action: "set_virtual_sticks", body };
      }
      return http.post(`/devices/${encodeURIComponent(deviceId)}/sticks`, body);
    }

    throw new Error(`Unknown tool: ${toolName}`);
  };
}

function toolPlanForGoal(goal) {
  const lower = String(goal || "").toLowerCase();
  if (lower.includes("tennis")) {
    return [
      { name: "get_device_state", args: {} },
      { name: "get_current_gps", args: {} },
      { name: "capture_rtmp_frame", args: {} },
      { name: "analyze_frame", args: { framePath: "{{capture.path}}", instruction: "Find tennis balls and estimate distance" } },
      { name: "estimate_target_offset", args: { analysis: "{{analyze}}" } },
      { name: "generate_action_candidates", args: { offset: "{{offset}}" } },
      { name: "safety_filter_actions", args: { candidates: "{{candidates}}" } },
      { name: "send_drone_command", args: { name: "ARM_REMOTE" } },
      { name: "send_drone_command", args: { name: "ENABLE_VIRTUAL_STICK" } },
      { name: "set_virtual_sticks", args: "{{selected.sticks}}" },
      { name: "send_drone_command", args: { name: "HOVER" } }
    ];
  }
  return [
    { name: "get_device_state", args: {} },
    { name: "capture_rtmp_frame", args: {} },
    { name: "analyze_frame", args: { framePath: "{{capture.path}}", instruction: "Provide safe short movement recommendation" } },
    { name: "send_drone_command", args: { name: "HOVER" } }
  ];
}

function renderTemplateArgs(step, memory) {
  if (typeof step.args === "string") {
    if (step.args === "{{selected.sticks}}") {
      return memory.selected && memory.selected.sticks ? memory.selected.sticks : {};
    }
    return {};
  }
  const args = { ...step.args };
  if (args.framePath === "{{capture.path}}") {
    args.framePath = memory.capture && memory.capture.path ? memory.capture.path : "";
  }
  if (args.analysis === "{{analyze}}") {
    args.analysis = memory.analyze || {};
  }
  if (args.offset === "{{offset}}") {
    args.offset = memory.offset || {};
  }
  if (args.candidates === "{{candidates}}") {
    args.candidates = memory.candidates || [];
  }
  return args;
}

async function runAgentSession(context, options = {}) {
  const onEvent = typeof options.onEvent === "function" ? options.onEvent : () => {};
  const runTool = buildToolRunner(context);
  const transcript = [];
  const memory = {};

  onEvent({ type: "session_start", ts: Date.now(), goal: context.goal, deviceId: context.deviceId });

  const plan = toolPlanForGoal(context.goal);
  for (let i = 0; i < plan.length; i += 1) {
    const step = plan[i];
    const args = renderTemplateArgs(step, memory);
    const delay = step.name === "set_virtual_sticks" || step.name === "send_drone_command" ? context.actionDelayMs : context.stepDelayMs;

    onEvent({
      type: "tool_call",
      ts: Date.now(),
      status: "queued",
      index: i + 1,
      total: plan.length,
      toolName: step.name,
      args,
      delayMs: delay
    });
    await waitMs(delay);

    onEvent({
      type: "tool_call",
      ts: Date.now(),
      status: "running",
      index: i + 1,
      total: plan.length,
      toolName: step.name,
      args
    });

    let result;
    try {
      result = await runTool(step.name, { deviceId: context.deviceId, ...args });
    } catch (error) {
      result = { ok: false, error: error.message || String(error) };
    }

    transcript.push({ index: i + 1, toolName: step.name, args, result });
    onEvent({
      type: "tool_result",
      ts: Date.now(),
      status: "done",
      index: i + 1,
      total: plan.length,
      toolName: step.name,
      result
    });

    if (step.name === "capture_rtmp_frame") {
      memory.capture = result;
    } else if (step.name === "analyze_frame") {
      memory.analyze = result;
    } else if (step.name === "estimate_target_offset") {
      memory.offset = result;
    } else if (step.name === "generate_action_candidates") {
      memory.candidates = result.candidates || [];
    } else if (step.name === "safety_filter_actions") {
      memory.selected = result.selected || null;
    }

    if (result && result.ok === false && step.name !== "capture_rtmp_frame") {
      const finalMessage = `Stopped after ${step.name} failed: ${result.error || "unknown error"}`;
      onEvent({ type: "assistant_final", ts: Date.now(), content: finalMessage });
      onEvent({ type: "session_complete", ts: Date.now(), finalMessage });
      return { finalMessage, transcript };
    }
  }

  const finalMessage = "Completed demo plan: used vision + planning tools and executed a cautious move-toward-target loop with hover.";
  onEvent({ type: "assistant_final", ts: Date.now(), content: finalMessage });
  onEvent({ type: "session_complete", ts: Date.now(), finalMessage });
  return { finalMessage, transcript };
}

function saveRunLog(result) {
  const dir = path.resolve(DEFAULT_LOG_DIR);
  fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, `agent-run-${Date.now()}.json`);
  fs.writeFileSync(filePath, JSON.stringify(result, null, 2), "utf8");
  return filePath;
}

async function runCli() {
  const context = parseArgs(process.argv);
  const events = [];

  const result = await runAgentSession(context, {
    onEvent: (event) => {
      events.push(event);
      if (event.type === "tool_call") {
        const marker = event.status === "queued" ? "..." : event.status === "running" ? ">>>" : "";
        process.stdout.write(`[${nowIso()}] ${marker} ${event.toolName} ${event.status}\n`);
        return;
      }
      if (event.type === "tool_result") {
        process.stdout.write(`[${nowIso()}] <<< ${event.toolName} done\n`);
        return;
      }
      if (event.type === "assistant_final") {
        process.stdout.write(`\nFinal:\n${event.content}\n`);
      }
    }
  });

  const filePath = saveRunLog({
    startedAt: nowIso(),
    context,
    executeEnabled: EXECUTE_ENABLED,
    simulatorOnly: SIMULATOR_ONLY,
    result,
    events
  });
  process.stdout.write(`Log: ${filePath}\n`);
}

if (require.main === module) {
  runCli().catch((error) => {
    console.error(`[${nowIso()}] ERROR agent crashed`, { error: error.stack || error.message || String(error) });
    process.exitCode = 1;
  });
}

module.exports = {
  createContext,
  runAgentSession,
  DEFAULT_MODEL,
  DEFAULT_BASE_URL,
  DEFAULT_DEVICE_ID,
  DEFAULT_ITERATIONS,
  EXECUTE_ENABLED,
  SIMULATOR_ONLY
};
