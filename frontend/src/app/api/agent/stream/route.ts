import { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let payload: { goal?: string; deviceId?: string; model?: string; maxIterations?: number } = {};
  try {
    payload = (await request.json()) as typeof payload;
  } catch {
    payload = {};
  }

  const baseUrl = process.env.AGENT_SERVER_BASE_URL || "http://localhost:8080";
  const apiKey = process.env.AGENT_SERVER_API_KEY || process.env.API_KEY || "";

  const upstream = await fetch(`${baseUrl.replace(/\/$/, "")}/agent/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(apiKey ? { "x-api-key": apiKey } : {}),
    },
    body: JSON.stringify({
      goal: payload.goal,
      deviceId: payload.deviceId || process.env.AGENT_DEVICE_ID,
      model: payload.model || process.env.AGENT_MODEL,
      maxIterations: payload.maxIterations,
    }),
    cache: "no-store",
  });

  if (!upstream.ok || !upstream.body) {
    const text = await upstream.text();
    return Response.json(
      {
        error: text || `agent stream unavailable (${upstream.status})`,
      },
      { status: upstream.status || 502 }
    );
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}
