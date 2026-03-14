import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SkySearch — AI Drone",
    short_name: "SkySearch",
    description: "Autonomous AI-powered drone search & reconnaissance.",
    start_url: "/",
    display: "standalone",
    background_color: "#06060C",
    theme_color: "#00E5FF",
    orientation: "landscape",
    icons: [
      { src: "/icon.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
