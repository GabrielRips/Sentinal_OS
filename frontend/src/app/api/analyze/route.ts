import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

const API_KEY = process.env.TWELVE_LABS_API_KEY!;
const BASE = "https://api.twelvelabs.io/v1.3";

interface IndexEntry {
  indexId: string;
  videoId: string;
}

// In-memory cache of created indexes (resets on cold start)
let cached: IndexEntry | null = null;

async function ensureIndexedVideo(): Promise<IndexEntry> {
  if (cached) return cached;

  // 1. Create an index with both search (marengo) and analysis (pegasus) models
  const idxRes = await fetch(`${BASE}/indexes`, {
    method: "POST",
    headers: { "x-api-key": API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      index_name: `sentinel-os-${Date.now()}`,
      models: [
        { model_name: "marengo2.7", model_options: ["visual", "audio"] },
        { model_name: "pegasus1.2", model_options: ["visual", "audio"] },
      ],
    }),
  });

  if (!idxRes.ok) {
    const err = await idxRes.text();
    throw new Error(`Failed to create index: ${err}`);
  }

  const { _id: indexId } = await idxRes.json();

  // 2. Upload the video file directly from disk
  const videoPath = path.join(process.cwd(), "public", "drone-demo.mp4");
  const videoBuffer = await readFile(videoPath);
  const videoBlob = new Blob([videoBuffer], { type: "video/mp4" });

  const fd = new FormData();
  fd.append("index_id", indexId);
  fd.append("video_file", videoBlob, "drone-demo.mp4");

  const taskRes = await fetch(`${BASE}/tasks`, {
    method: "POST",
    headers: { "x-api-key": API_KEY },
    body: fd,
  });

  if (!taskRes.ok) {
    const err = await taskRes.text();
    throw new Error(`Failed to upload video: ${err}`);
  }

  const { video_id: videoId, _id: taskId } = await taskRes.json();

  // 3. Poll until indexing is complete
  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 5000));
    const statusRes = await fetch(`${BASE}/tasks/${taskId}`, {
      headers: { "x-api-key": API_KEY },
    });
    if (!statusRes.ok) continue;
    const status = await statusRes.json();
    if (status.status === "ready") break;
    if (status.status === "failed") throw new Error("Video indexing failed");
  }

  cached = { indexId, videoId };
  return cached;
}

export async function POST(req: NextRequest) {
  try {
    const { query, mode } = await req.json();

    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "Missing query" }, { status: 400 });
    }

    if (!API_KEY) {
      return NextResponse.json({ error: "Twelve Labs API key not configured" }, { status: 500 });
    }

    const { indexId, videoId } = await ensureIndexedVideo();

    if (mode === "search") {
      const searchFd = new FormData();
      searchFd.append("index_id", indexId);
      searchFd.append("query_text", query);
      searchFd.append("search_options", "visual");
      searchFd.append("threshold", "low");
      searchFd.append("page_limit", "5");
      const searchRes = await fetch(`${BASE}/search`, {
        method: "POST",
        headers: { "x-api-key": API_KEY },
        body: searchFd,
      });

      if (!searchRes.ok) {
        const err = await searchRes.text();
        throw new Error(`Search failed: ${err}`);
      }

      const results = await searchRes.json();
      return NextResponse.json({ type: "search", results: results.data || [] });
    } else {
      const analyzeRes = await fetch(`${BASE}/analyze`, {
        method: "POST",
        headers: { "x-api-key": API_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({
          video_id: videoId,
          prompt: query,
          stream: false,
          temperature: 0.2,
        }),
      });

      if (!analyzeRes.ok) {
        const err = await analyzeRes.text();
        throw new Error(`Analysis failed: ${err}`);
      }

      const result = await analyzeRes.json();
      return NextResponse.json({ type: "analyze", data: result.data || result.text || "" });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
