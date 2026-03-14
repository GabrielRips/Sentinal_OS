"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import FadeIn from "@/components/FadeIn";
import { getDroneVideoConfig } from "@/lib/droneVideo";

interface CaptureItem {
  time: string;
  type: string;
  confidence: string;
  accent: string;
  thumbnail?: string;
}

const initialCaptures: CaptureItem[] = [
  { time: "14:02:15", type: "Person", confidence: "94%", accent: "#CDFF00" },
  { time: "14:05:33", type: "Vehicle", confidence: "87%", accent: "#F59E0B" },
  { time: "14:12:01", type: "Person", confidence: "91%", accent: "#CDFF00" },
  { time: "14:18:47", type: "Object", confidence: "76%", accent: "#888" },
  { time: "14:22:03", type: "Person", confidence: "89%", accent: "#CDFF00" },
  { time: "14:28:19", type: "Animal", confidence: "82%", accent: "#22C55E" },
];

function formatTime(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600).toString().padStart(2, "0");
  const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, "0");
  const sec = (totalSeconds % 60).toString().padStart(2, "0");
  return `${h}:${m}:${sec}`;
}

function getSupportedMediaRecorderMimeType(): string | undefined {
  const candidates = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
  ];

  return candidates.find((mime) => MediaRecorder.isTypeSupported(mime));
}

function formatClockTime(date = new Date()) {
  return `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}:${date.getSeconds().toString().padStart(2, "0")}`;
}

export default function LiveFeedPage() {
  const videoConfig = getDroneVideoConfig();
  const [scanY, setScanY] = useState(0);
  const [recording, setRecording] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const [captures, setCaptures] = useState<CaptureItem[]>(initialCaptures);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [videoStatus, setVideoStatus] = useState(
    videoConfig.isRealFeedActive ? "Connected to live stream" : "Demo mode: local MP4 playback"
  );

  const videoRef = useRef<HTMLVideoElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const generatedUrlsRef = useRef<string[]>([]);

  useEffect(() => {
    const scanInterval = setInterval(() => {
      setScanY((prev) => (prev >= 100 ? 0 : prev + 0.3));
    }, 30);
    return () => {
      clearInterval(scanInterval);
    };
  }, []);

  useEffect(() => {
    if (!recording) return;
    const id = window.setInterval(() => setElapsed((prev) => prev + 1), 1000);
    return () => window.clearInterval(id);
  }, [recording]);

  useEffect(() => {
    return () => {
      if (recorderRef.current && recorderRef.current.state !== "inactive") {
        recorderRef.current.stop();
      }
      generatedUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const downloadBlob = useCallback((blob: Blob, prefix: string, ext: string) => {
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href;
    a.download = `${prefix}-${stamp}.${ext}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(href);
  }, []);

  const stopRecording = useCallback(() => {
    if (!recorderRef.current || recorderRef.current.state === "inactive") return;
    recorderRef.current.stop();
    setVideoStatus("Recording stopped, preparing download...");
  }, []);

  const startRecording = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;

    const captureStream = (video as HTMLVideoElement & { captureStream?: () => MediaStream }).captureStream;

    if (typeof captureStream !== "function") {
      setVideoStatus("Recording unsupported in this browser");
      return;
    }

    try {
      if (video.paused) {
        await video.play();
      }

      const stream = captureStream.call(video);
      const mimeType = getSupportedMediaRecorderMimeType();
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      chunksRef.current = [];
      recorderRef.current = recorder;
      setElapsed(0);
      setRecording(true);
      setVideoStatus("Recording in progress");

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onerror = () => {
        setRecording(false);
        setVideoStatus("Recording failed");
      };

      recorder.onstop = () => {
        setRecording(false);
        const type = recorder.mimeType || "video/webm";
        const blob = new Blob(chunksRef.current, { type });
        chunksRef.current = [];
        if (blob.size > 0) {
          downloadBlob(blob, "drone-recording", "webm");
          setVideoStatus("Recording downloaded");
        } else {
          setVideoStatus("Recording empty, nothing downloaded");
        }
      };

      recorder.start(1000);
    } catch {
      setRecording(false);
      setVideoStatus("Unable to start recording");
    }
  }, [downloadBlob]);

  const toggleRecording = useCallback(() => {
    if (recording) {
      stopRecording();
      return;
    }

    void startRecording();
  }, [recording, startRecording, stopRecording]);

  const handleCapture = useCallback(async () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
      setVideoStatus("Feed not ready for capture");
      return;
    }

    try {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        setVideoStatus("Capture unavailable");
        return;
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const pngBlob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, "image/png");
      });

      if (!pngBlob) {
        setVideoStatus("Capture failed");
        return;
      }

      const thumbnailUrl = URL.createObjectURL(pngBlob);
      generatedUrlsRef.current.push(thumbnailUrl);

      setCaptures((prev) => [
        {
          time: formatClockTime(),
          type: "Frame",
          confidence: "100%",
          accent: "#22C55E",
          thumbnail: thumbnailUrl,
        },
        ...prev.slice(0, 11),
      ]);

      downloadBlob(pngBlob, "drone-capture", "png");
      setVideoStatus("Capture downloaded");
    } catch {
      setVideoStatus("Capture blocked by stream security settings");
    }
  }, [downloadBlob]);

  return (
    <section className="max-w-7xl mx-auto px-6 lg:px-12 pt-28 pb-32">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <FadeIn>
          <div>
            <p className="section-label mb-2">Surveillance</p>
            <h1 className="text-2xl sm:text-3xl font-semibold text-[#EDEDED] tracking-tight">
              Live Drone Feed
            </h1>
          </div>
        </FadeIn>
        <FadeIn delay={200}>
          <div className="flex items-center gap-3">
            {recording && (
              <span className="w-1.5 h-1.5 bg-red-500 animate-pulse" />
            )}
            <span className="text-xs font-mono text-[#555]">
              {recording ? "REC" : "PAUSED"} {formatTime(elapsed)}
            </span>
          </div>
        </FadeIn>
      </div>

      {/* Video Player */}
      <FadeIn>
        <div className="relative w-full aspect-video bg-[#0A0A0A] border border-[#1A1A1A]">
          {/* Scan line */}
          {aiEnabled && (
            <div
              className="absolute left-0 right-0 h-px bg-[#CDFF00]/20"
              style={{ top: `${scanY}%` }}
            />
          )}

          {/* Corner brackets */}
          <div className="absolute top-4 left-4 w-8 h-8 border-t border-l border-[#2A2A2A]" />
          <div className="absolute top-4 right-4 w-8 h-8 border-t border-r border-[#2A2A2A]" />
          <div className="absolute bottom-14 left-4 w-8 h-8 border-b border-l border-[#2A2A2A]" />
          <div className="absolute bottom-14 right-4 w-8 h-8 border-b border-r border-[#2A2A2A]" />

          {/* AI Detections */}
          {aiEnabled && (
            <>
              <div className="absolute top-[25%] left-[20%] w-24 h-32 border border-[#CDFF00]/60 border-dashed">
                <div className="absolute -top-5 left-0 text-[9px] font-mono text-[#CDFF00] bg-[#CDFF00]/10 px-1.5 py-0.5">
                  PERSON · 94%
                </div>
              </div>
              <div className="absolute top-[35%] right-[25%] w-28 h-16 border border-[#F59E0B]/40 border-dashed">
                <div className="absolute -top-5 left-0 text-[9px] font-mono text-[#F59E0B] bg-[#F59E0B]/10 px-1.5 py-0.5">
                  VEHICLE · 87%
                </div>
              </div>
              <div className="absolute bottom-[30%] left-[50%] w-20 h-28 border border-[#888]/40 border-dashed">
                <div className="absolute -top-5 left-0 text-[9px] font-mono text-[#888] bg-white/5 px-1.5 py-0.5">
                  PERSON · 91%
                </div>
              </div>
            </>
          )}

          {/* Background video */}
          <video
            ref={videoRef}
            autoPlay
            muted
            loop={!videoConfig.isRealFeedActive}
            playsInline
            crossOrigin="anonymous"
            onLoadedData={() => {
              setStreamError(null);
              setVideoStatus(videoConfig.isRealFeedActive ? "Live stream connected" : "Demo feed loaded");
            }}
            onError={() => {
              setStreamError("Unable to load video stream. Check your stream URL and CORS settings.");
              setVideoStatus("Stream connection failed");
            }}
            className="absolute inset-0 w-full h-full object-cover opacity-25"
          >
            <source src={videoConfig.sourceUrl} />
          </video>

          {/* HUD Bottom */}
          <div className="absolute bottom-0 left-0 right-0 bg-[#0A0A0A] border-t border-[#1A1A1A] px-4 py-2.5 flex items-center gap-6">
            <span className="text-[10px] font-mono text-[#555]">ALT 45m</span>
            <span className="text-[10px] font-mono text-[#555]">SPD 12km/h</span>
            <span className="text-[10px] font-mono text-[#555]">GPS 48.85°N 2.35°E</span>
            <span className="text-[10px] font-mono ml-auto" style={{ color: aiEnabled ? "#CDFF00" : "#555" }}>
              AI: {aiEnabled ? "ON" : "OFF"}
            </span>
            <span className="text-[10px] font-mono text-[#555]">
              FEED {videoConfig.isRealFeedActive ? "REAL" : "DEMO"}
            </span>
            <span className="text-[10px] font-mono text-red-400 flex items-center gap-1.5">
              <span className="w-1 h-1 bg-red-500" />
              {recording ? `REC ${formatTime(elapsed)}` : "REC OFF"}
            </span>
          </div>
        </div>
      </FadeIn>

      {/* Controls */}
      <FadeIn delay={200}>
        <div className="flex flex-wrap gap-2 mt-4">
          <button
            onClick={toggleRecording}
            className={`border border-[#1A1A1A] px-4 py-2 text-xs font-mono tracking-wider uppercase transition-colors hover:border-[#2A2A2A] hover:bg-[#111] ${
              recording ? "text-red-400" : "text-[#888]"
            }`}
          >
            {recording ? "Stop Recording" : "Record"}
          </button>
          <button
            onClick={handleCapture}
            className="border border-[#1A1A1A] px-4 py-2 text-xs font-mono tracking-wider uppercase transition-colors hover:border-[#2A2A2A] hover:bg-[#111] text-[#888]"
          >
            Screenshot
          </button>
          <button
            onClick={() => setAiEnabled(!aiEnabled)}
            className={`border border-[#1A1A1A] px-4 py-2 text-xs font-mono tracking-wider uppercase transition-colors hover:border-[#2A2A2A] hover:bg-[#111] ${
              aiEnabled ? "text-[#CDFF00]" : "text-[#888]"
            }`}
          >
            AI {aiEnabled ? "ON" : "OFF"}
          </button>
          <button className="border border-[#1A1A1A] px-4 py-2 text-xs font-mono tracking-wider uppercase transition-colors hover:border-[#2A2A2A] hover:bg-[#111] text-[#888]">
            Night Mode
          </button>
          <button className="border border-[#1A1A1A] px-4 py-2 text-xs font-mono tracking-wider uppercase transition-colors hover:border-[#2A2A2A] hover:bg-[#111] text-[#888]">
            Fullscreen
          </button>
        </div>
        <p className="mt-3 text-[10px] font-mono text-[#666]">{videoStatus}</p>
        {streamError && <p className="mt-1 text-[10px] font-mono text-red-400">{streamError}</p>}
      </FadeIn>

      {/* Recent Captures */}
      <FadeIn delay={400}>
        <div className="mt-16">
          <p className="section-label mb-6">Recent Captures</p>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-px bg-[#1A1A1A]">
            {captures.map((cap, i) => (
              <div
                key={i}
                className="bg-[#0A0A0A] hover:bg-[#0F0F0F] transition-colors cursor-pointer group"
              >
                <div className="aspect-square bg-[#111] relative border-b border-[#1A1A1A]">
                  {cap.thumbnail ? (
                    <div
                      className="w-full h-full bg-cover bg-center"
                      style={{ backgroundImage: `url(${cap.thumbnail})` }}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div
                        className="w-6 h-8 border border-dashed opacity-30"
                        style={{ borderColor: cap.accent }}
                      />
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-[9px] font-mono text-[#555]">{cap.time}</p>
                  <p className="text-xs font-medium text-[#EDEDED] mt-0.5">{cap.type}</p>
                  <p className="text-[9px] font-mono mt-0.5" style={{ color: cap.accent }}>
                    {cap.confidence}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </FadeIn>
    </section>
  );
}
