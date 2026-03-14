# Remote Control Server (Minimal)

Minimal Node.js server that works with the app-side implementation in `android-sdk-v5-sample`.

## Features

- WebSocket endpoint for device connection
- Receives telemetry/event/ack messages from app
- REST API to send commands to a connected device
- Optional auth for websocket + REST
- Optional HMAC command signing (`SHARED_SECRET`)

## Requirements

- Node.js 18+

## Start

```bash
cd remote-control-server
npm install
npm start
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


