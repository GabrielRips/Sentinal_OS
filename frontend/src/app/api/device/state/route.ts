import { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const baseUrl = process.env.AGENT_SERVER_BASE_URL || "http://localhost:8080";
  const apiKey = process.env.AGENT_SERVER_API_KEY || process.env.API_KEY || "";
  const defaultDeviceId = process.env.AGENT_DEVICE_ID || "uav-01";
  const searchParams = request.nextUrl.searchParams;
  const deviceId = searchParams.get("deviceId") || defaultDeviceId;

  const upstream = await fetch(
    `${baseUrl.replace(/\/$/, "")}/devices/${encodeURIComponent(deviceId)}/state`,
    {
      method: "GET",
      headers: {
        ...(apiKey ? { "x-api-key": apiKey } : {}),
      },
      cache: "no-store",
    }
  );

  if (!upstream.ok) {
    const text = await upstream.text();
    return Response.json(
      {
        error: text || `device state unavailable (${upstream.status})`,
      },
      { status: upstream.status || 502 }
    );
  }

  const payload = await upstream.json();
  return Response.json(payload, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
