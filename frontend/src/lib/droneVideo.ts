export type DroneFeedMode = "demo" | "real";
export type DroneFeedSourceType = "video" | "youtube";

const DEFAULT_DEMO_VIDEO = "/forest-fire-web.mp4";

function parseMode(value: string | undefined): DroneFeedMode {
  return value?.toLowerCase() === "real" ? "real" : "demo";
}

function extractYouTubeId(url: string): string | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "").toLowerCase();

    if (host === "youtu.be") {
      const id = parsed.pathname.split("/").filter(Boolean)[0];
      return id || null;
    }

    if (host === "youtube.com" || host === "m.youtube.com") {
      const watchId = parsed.searchParams.get("v");
      if (watchId) return watchId;

      const parts = parsed.pathname.split("/").filter(Boolean);
      const liveIdx = parts.indexOf("live");
      if (liveIdx >= 0 && parts[liveIdx + 1]) return parts[liveIdx + 1];

      const embedIdx = parts.indexOf("embed");
      if (embedIdx >= 0 && parts[embedIdx + 1]) return parts[embedIdx + 1];
    }
  } catch {
    return null;
  }

  return null;
}

export function getDroneVideoConfig() {
  const mode = parseMode(process.env.NEXT_PUBLIC_DRONE_FEED_MODE);
  const streamUrl = process.env.NEXT_PUBLIC_DRONE_STREAM_URL?.trim() ?? "";
  const isRealFeedActive = mode === "real" && streamUrl.length > 0;
  const youTubeId = isRealFeedActive ? extractYouTubeId(streamUrl) : null;
  const sourceType: DroneFeedSourceType = youTubeId ? "youtube" : "video";
  const sourceUrl = isRealFeedActive ? streamUrl : DEFAULT_DEMO_VIDEO;
  const youtubeEmbedUrl = youTubeId
    ? `https://www.youtube.com/embed/${youTubeId}?autoplay=1&mute=1&playsinline=1&rel=0`
    : null;

  return {
    mode,
    streamUrl,
    sourceType,
    sourceUrl,
    youtubeEmbedUrl,
    isRealFeedActive,
  };
}
