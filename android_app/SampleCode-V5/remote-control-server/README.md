# Remote Control Server (Minimal)

Minimal Node.js server that works with the app-side implementation in `android-sdk-v5-sample`.

## Features

- WebSocket endpoint for device connection
- Receives telemetry/event/ack messages from app
- REST API to send commands to a connected device
- Optional auth for websocket + REST
- Optional HMAC command signing (`SHARED_SECRET`)
- Simulator-first AI agent runtime with tool-calling loop

## Requirements

- Node.js 18+

## Start

```bash
cd remote-control-server
npm install
npm start
```

In another terminal, you can run the agent runtime:

```bash
npm run agent -- --goal "Go to the nearest McDonald's"
```

Server defaults to `http://localhost:8080` and websocket endpoint:

- `ws://localhost:8080/ws/device/<deviceId>`

## Environment Variables

Copy `.env.example` and export values in your shell (or use your own env loader):

- `PORT` - HTTP/WS port, default `8080`
- `DEVICE_TOKEN` - if set, app websocket must send `Authorization: Bearer <DEVICE_TOKEN>`
- `API_KEY` - if set, REST requests must include header `x-api-key: <API_KEY>`
- `SHARED_SECRET` - if set, server signs commands with HMAC SHA-256. App must use same `sharedSecret` in remote config.
- `LOG_RAW_MESSAGES=1` - optional verbose logging for full WS payloads
- `AGENT_EXECUTE=1` - allow agent to send real commands; default `0` (dry-run)
- `AGENT_SIMULATOR_ONLY=1` - keep simulator-only safety mode enabled
- `AGENT_RTMP_URL` - optional RTMP URL for frame capture
- `OPENAI_API_KEY` - optional, enables full tool-calling + vision
- `AGENT_DEMO_STEP_DELAY_MS` - delay between non-action tool calls (slower animation)
- `AGENT_DEMO_ACTION_DELAY_MS` - delay before command/stick tool calls

### Live Agent Stream Endpoint

For frontend thinking animations with real tool traces:

- `POST /agent/stream`
- body: `{ "goal": "...", "deviceId": "uav-01" }`
- response: newline-delimited JSON events (`application/x-ndjson`)

Event types include:

- `session_start`
- `iteration_start`
- `tool_call`
- `tool_result`
- `assistant_final`
- `session_complete`
- `result`
- `error`

## App Remote Config

Use Virtual Stick -> `Remote Config` button and set:

```json
{
  "serverUrl": "ws://<your-host>:8080/ws/device/uav-01",
  "deviceId": "uav-01",
  "authToken": "",
  "sharedSecret": ""
}
```

For Android emulator/device loopback to local machine, use your host IP (not `localhost`).

## REST API

### Health

`GET /health`

### List devices

`GET /devices`

### Get device state and history

`GET /devices/:deviceId/state`

### Send generic command

`POST /devices/:deviceId/commands`

Body:

```json
{
  "name": "ENABLE_VIRTUAL_STICK",
  "payload": {},
  "ttlMs": 5000
}
```

### Send stick command shortcut

`POST /devices/:deviceId/sticks`

Body:

```json
{
  "leftHorizontal": 0,
  "leftVertical": 200,
  "rightHorizontal": 0,
  "rightVertical": 0,
  "ttlMs": 1500
}
```

## Typical Command Sequence

1. `ARM_REMOTE`
2. `ENABLE_VIRTUAL_STICK`
3. Repeated `SET_STICKS` (or `/sticks` endpoint)
4. `HOVER` or `DISARM_REMOTE`
5. `LAND` when done

## AI Agent (Simulator First)

The agent supports a Claude-code style execution loop where the model chooses tools repeatedly:

1. Read drone/device state
2. Query GPS + search POI + plan route
3. Capture and analyze livestream frame
4. Generate and send control actions (`/commands`, `/sticks`)
5. Re-check telemetry/acks and continue

### Built-in Tools

- `get_device_state`
- `get_current_gps`
- `search_poi`
- `plan_route`
- `capture_rtmp_frame`
- `analyze_frame`
- `send_drone_command`
- `set_virtual_sticks`

### Safe Defaults

- `AGENT_SIMULATOR_ONLY=1`
- `AGENT_EXECUTE=0` (dry-run only)

So the first runs are non-destructive even if the model decides to call command tools.

### Enable Real Execution in Simulator

```bash
AGENT_EXECUTE=1 npm run agent -- --goal "Take off, move forward slightly, and hover"
```

### Example: nearest McDonald's

```bash
AGENT_EXECUTE=0 npm run agent -- --goal "I want to go to the nearest McDonald's"
```

This performs planning/perception/tool calls and logs the full trace without moving the aircraft.

### Example: tennis ball demo (slower Claude-code style)

```bash
AGENT_EXECUTE=0 AGENT_DEMO_STEP_DELAY_MS=1000 AGENT_DEMO_ACTION_DELAY_MS=1500 npm run agent -- --goal "Go closer to the tennis balls"
```

This runs a visible staged sequence of tool calls: device state, frame capture, vision analysis, action generation, safety filtering, stick action, and hover.

### Frontend Mode Selection

In `frontend/.env`:

- `NEXT_PUBLIC_AGENT_ENV=demo` -> simulated thinking animation
- `NEXT_PUBLIC_AGENT_ENV=real` -> live tool-trace stream from `/agent/stream`

If `NEXT_PUBLIC_AGENT_ENV` is unset, frontend defaults to:

- `real` in production
- `demo` in non-production

### Logs

Each run writes a structured JSON log in:

- `agent-logs/agent-run-<timestamp>.json`
