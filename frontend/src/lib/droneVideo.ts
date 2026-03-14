export type DroneFeedMode = "demo" | "real";

const DEFAULT_DEMO_VIDEO = "/forest-fire-web.mp4";

function parseMode(value: string | undefined): DroneFeedMode {
  return value?.toLowerCase() === "real" ? "real" : "demo";
}

export function getDroneVideoConfig() {
  const mode = parseMode(process.env.NEXT_PUBLIC_DRONE_FEED_MODE);
  const streamUrl = process.env.NEXT_PUBLIC_DRONE_STREAM_URL?.trim() ?? "";
  const isRealFeedActive = mode === "real" && streamUrl.length > 0;

  return {
    mode,
    streamUrl,
    sourceUrl: isRealFeedActive ? streamUrl : DEFAULT_DEMO_VIDEO,
    isRealFeedActive,
  };
}
