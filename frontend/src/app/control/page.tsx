"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { getDroneVideoConfig } from "@/lib/droneVideo";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  id: number;
  role: "ai" | "user";
  text: string;
  displayText: string;
}

interface Notification {
  id: string;
  ts: number;
  time: string;
  text: string;
  accent: string;
}

interface DeviceEventPayload {
  ts?: number;
  event?: string;
  detail?: string;
  deviceId?: string;
}

interface DeviceAckPayload {
  ts?: number;
  commandId?: string;
  success?: boolean;
  message?: string;
}

interface DeviceStatePayload {
  events?: DeviceEventPayload[];
  acks?: DeviceAckPayload[];
}

interface ThinkingStep {
  key: string;
  label: string;
  status: "pending" | "active" | "done" | "error";
}

interface AgentStreamEvent {
  type: string;
  status?: "queued" | "running" | "done" | "error";
  toolName?: string;
  result?: { ok?: boolean };
  finalMessage?: string;
  error?: string;
}

interface Coordinates {
  lat: number;
  lng: number;
}

const LiveGpsMap = dynamic(() => import("@/components/LiveGpsMap"), {
  ssr: false,
});

// ─── Data ─────────────────────────────────────────────────────────────────────

const initialMessages: Message[] = [
  {
    id: 0,
    role: "ai",
    text: "SkySearch AI online. Connected to DJI Mavic 3 Pro. All systems nominal. Ready for mission briefing.",
    displayText: "SkySearch AI online. Connected to DJI Mavic 3 Pro. All systems nominal. Ready for mission briefing.",
  },
  {
    id: 1,
    role: "ai",
    text: 'Tip: Try commands like "search the north field", "find my friend", or "take a photo" — I\'ll handle the rest.',
    displayText: 'Tip: Try commands like "search the north field", "find my friend", or "take a photo" — I\'ll handle the rest.',
  },
];

const initialNotifications: Notification[] = [
  { id: "sample-1", ts: 1700000000000, time: "14:02", text: "Person detected - Sector 4, 94% match", accent: "#CDFF00" },
  { id: "sample-2", ts: 1699999940000, time: "14:01", text: "Entering search zone B", accent: "#22C55E" },
  { id: "sample-3", ts: 1699999760000, time: "13:58", text: "Mission started - scanning 4 sectors", accent: "#8EA0BA" },
  { id: "sample-4", ts: 1699999700000, time: "13:57", text: "AI model loaded, ready", accent: "#22C55E" },
];

const CRITICAL_ALERT_WORDS = ["fire", "smoke", "emergency", "hazard", "collision"];
const WARNING_ALERT_WORDS = ["alert", "warning", "detected", "anomaly"];
const SUCCESS_WORDS = ["complete", "completed", "success", "done", "landed", "arrived"];
const MAX_NOTIFICATIONS = 25;

function formatClock(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
}

function pickAlertAccent(text: string): string {
  const lower = text.toLowerCase();
  if (CRITICAL_ALERT_WORDS.some((word) => lower.includes(word))) return "#F87171";
  if (WARNING_ALERT_WORDS.some((word) => lower.includes(word))) return "#F59E0B";
  if (SUCCESS_WORDS.some((word) => lower.includes(word))) return "#22C55E";
  return "#8EA0BA";
}

function titleCase(text: string): string {
  return text
    .split(" ")
    .filter(Boolean)
    .map((token) => token[0].toUpperCase() + token.slice(1))
    .join(" ");
}

function mapDeviceEventToNotification(item: DeviceEventPayload): Notification | null {
  const ts = typeof item.ts === "number" ? item.ts : Date.now();
  const eventName = (item.event || "event").replaceAll("_", " ").trim();
  const detail = (item.detail || "").trim();

  let text = detail;
  if (!text) {
    if (eventName === "connected") text = "Drone connected";
    else if (eventName === "disconnected") text = "Drone disconnected";
    else if (eventName === "session start") text = "Mission session started";
    else text = `${titleCase(eventName)} alert`;
  }

  return {
    id: `event-${ts}-${eventName}-${text}`,
    ts,
    time: formatClock(ts),
    text,
    accent: pickAlertAccent(`${eventName} ${text}`),
  };
}

function mapAckToNotification(item: DeviceAckPayload): Notification | null {
  const ts = typeof item.ts === "number" ? item.ts : Date.now();
  const message = (item.message || "").trim();
  const commandId = (item.commandId || "").trim();
  const success = !!item.success;

  const text = success
    ? `Task completed${message ? `: ${message}` : ""}`
    : `Task failed${message ? `: ${message}` : ""}`;

  return {
    id: `ack-${ts}-${commandId || text}`,
    ts,
    time: formatClock(ts),
    text,
    accent: success ? "#22C55E" : "#F87171",
  };
}

function deriveNotificationsFromState(payload: DeviceStatePayload): Notification[] {
  const eventNotifications = (payload.events || [])
    .map((item) => mapDeviceEventToNotification(item))
    .filter((item): item is Notification => item !== null);

  const ackNotifications = (payload.acks || [])
    .map((item) => mapAckToNotification(item))
    .filter((item): item is Notification => item !== null);

  const deduped = new Map<string, Notification>();
  [...eventNotifications, ...ackNotifications].forEach((item) => {
    deduped.set(item.id, item);
  });

  return [...deduped.values()]
    .sort((a, b) => b.ts - a.ts)
    .slice(0, MAX_NOTIFICATIONS);
}

const quickCommands = ["Go closer to the tennis balls", "Search area", "Find my friend", "Return home", "Hover", "Land"];

const aiResponses: Record<string, string> = {
  search: "Beginning area search pattern. Scanning sector 1 of 4. Altitude set to 45m for optimal coverage. I'll alert you the moment anything is detected.",
  find: "Activating face recognition and scanning the area. Cross-referencing 12 loaded profiles against live feed. Stay close — I'll call it out when I get a match.",
  friend: "Activating face recognition and scanning the area. Cross-referencing 12 loaded profiles against live feed. Stay close — I'll call it out when I get a match.",
  return: "Returning to home position. ETA 45 seconds. Current distance: 320m. Plotting optimal return path now.",
  hover: "Holding position. Altitude: 45.2m. Wind speed: 8 km/h NW. Stable hover confirmed. I'll stay here until your next command.",
  photo: "Capturing high-resolution photo… Done. Image saved. Resolution: 5472×3648. No additional targets detected in frame.",
  land: "Initiating landing sequence. Checking landing zone — clear. Descending at 1.5 m/s. Stand by.",
  scan: "Switching to expanded scan mode. Increasing search radius to 200m. AI detection overlay active.",
  default: "Command received. Processing your request now. Adjusting flight parameters and updating mission objectives. I'll keep you updated on progress.",
};

function getResponse(text: string): string {
  const lower = text.toLowerCase();
  for (const [key, resp] of Object.entries(aiResponses)) {
    if (key !== "default" && lower.includes(key)) return resp;
  }
  return aiResponses.default;
}

function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600).toString().padStart(2, "0");
  const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, "0");
  const s = (totalSeconds % 60).toString().padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function formatCoordinate(value: number, positive: string, negative: string): string {
  return `${Math.abs(value).toFixed(5)}°${value >= 0 ? positive : negative}`;
}

function getSupportedMediaRecorderMimeType(): string | undefined {
  const candidates = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
  ];

  return candidates.find((mime) => MediaRecorder.isTypeSupported(mime));
}

const IS_PROD = process.env.NODE_ENV === "production";
const AGENT_ENV = process.env.NEXT_PUBLIC_AGENT_ENV ?? (IS_PROD ? "real" : "demo");
const USE_REAL_AGENT_STREAM = AGENT_ENV === "real";
const DEMO_STEP_DELAY_MS = Number(process.env.NEXT_PUBLIC_AGENT_DEMO_STEP_DELAY_MS || 1000);
const DEMO_ACTION_DELAY_MS = Number(process.env.NEXT_PUBLIC_AGENT_DEMO_ACTION_DELAY_MS || 1500);
const ACTION_TOOLS = new Set(["send_drone_command", "set_virtual_sticks"]);

const AGENT_TOOL_LABELS: Record<string, string> = {
  get_device_state: "Checking device link",
  get_current_gps: "Reading GPS telemetry",
  search_poi: "Searching nearby POIs",
  plan_route: "Planning safe route",
  capture_rtmp_frame: "Capturing live frame",
  analyze_frame: "Analyzing scene",
  estimate_target_offset: "Estimating ball offset",
  generate_action_candidates: "Generating movement options",
  safety_filter_actions: "Applying safety filters",
  send_drone_command: "Preparing control command",
  set_virtual_sticks: "Tuning virtual sticks",
};

const DEMO_SEQUENCE = [
  "get_device_state",
  "get_current_gps",
  "capture_rtmp_frame",
  "analyze_frame",
  "estimate_target_offset",
  "generate_action_candidates",
  "safety_filter_actions",
  "send_drone_command",
  "set_virtual_sticks",
  "send_drone_command",
];

const SEARCH_SEQUENCE = [
  "get_device_state",
  "get_current_gps",
  "search_poi",
  "plan_route",
  "capture_rtmp_frame",
  "analyze_frame",
  "send_drone_command",
];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function pickDemoSequence(text: string): string[] {
  const lower = text.toLowerCase();
  if (lower.includes("tennis")) {
    return DEMO_SEQUENCE;
  }
  if (lower.includes("search") || lower.includes("find") || lower.includes("friend")) {
    return SEARCH_SEQUENCE;
  }
  return DEMO_SEQUENCE;
}

// ─── Waveform Bars ─────────────────────────────────────────────────────────────

function WaveformBars({
  active,
  color = "#B6C2D5",
  bars = 5,
}: {
  active: boolean;
  color?: string;
  bars?: number;
}) {
  const delays = [0, 0.08, 0.16, 0.08, 0];
  return (
    <div className="flex items-center gap-px" style={{ height: "14px" }}>
      {Array.from({ length: bars }).map((_, i) => {
        const delay = delays[i % delays.length];
        return (
          <div
            key={i}
            style={{
              width: "2px",
              height: "14px",
              backgroundColor: color,
              transformOrigin: "center",
              opacity: active ? 1 : 0.3,
              animation: active
                ? `waveBar 0.45s ease-in-out ${delay}s infinite alternate`
                : "none",
              transform: active ? undefined : "scaleY(0.25)",
              transition: "opacity 0.2s, transform 0.2s",
            }}
          />
        );
      })}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ControlPanel() {
  const videoConfig = getDroneVideoConfig();
  const isYouTubeEmbed = videoConfig.sourceType === "youtube" && !!videoConfig.youtubeEmbedUrl;
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [scanY, setScanY] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);

  const [currentPosition, setCurrentPosition] = useState<Coordinates | null>(null);
  const [homePosition, setHomePosition] = useState<Coordinates | null>(null);
  const [flightPath, setFlightPath] = useState<[number, number][]>([]);
  const [locationStatus, setLocationStatus] = useState("Requesting GPS lock...");
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingId, setSpeakingId] = useState<number | null>(null);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [thinkingSteps, setThinkingSteps] = useState<ThinkingStep[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [agentStatus, setAgentStatus] = useState("");
  const [isAgentRunning, setIsAgentRunning] = useState(false);

  const [mobileTab, setMobileTab] = useState<"control" | "status">("control");
  const [streamError, setStreamError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [showAnalyzeModal, setShowAnalyzeModal] = useState(false);
  const [analyzeQuery, setAnalyzeQuery] = useState("");
  const [analyzeMode, setAnalyzeMode] = useState<"analyze" | "search">("analyze");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [videoStatus, setVideoStatus] = useState(
    videoConfig.isRealFeedActive ? "Connected to live stream" : "Demo mode: local MP4 playback"
  );

  const chatEndRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const idRef = useRef(initialMessages.length);
  const voiceEnabledRef = useRef(voiceEnabled);

  const setQueuedToolStep = useCallback((toolName: string) => {
    const key = toolName || "agent";
    const label = AGENT_TOOL_LABELS[key] || key.replaceAll("_", " ");
    setThinkingSteps((prev) => {
      const index = prev.findIndex((step) => step.key === key);
      if (index >= 0) {
        const next = [...prev];
        if (next[index].status === "done" || next[index].status === "error") {
          next[index] = { ...next[index], status: "pending" };
        }
        return next;
      }
      return [...prev, { key, label, status: "pending" }];
    });
  }, []);

  const setActiveToolStep = useCallback((toolName: string) => {
    const key = toolName || "agent";
    const label = AGENT_TOOL_LABELS[key] || key.replaceAll("_", " ");
    setThinkingSteps((prev) => {
      const normalized: ThinkingStep[] = prev.map((step) => ({
        ...step,
        status: step.status === "active" ? "done" : step.status,
      }));
      const index = normalized.findIndex((step) => step.key === key);
      if (index >= 0) {
        normalized[index] = { ...normalized[index], status: "active" };
        return normalized;
      }
      return [...normalized, { key, label, status: "active" }];
    });
  }, []);

  const finalizeToolStep = useCallback((toolName: string, status: "done" | "error") => {
    const key = toolName || "agent";
    setThinkingSteps((prev) =>
      prev.map((step) => (step.key === key ? { ...step, status } : step))
    );
  }, []);

  useEffect(() => { voiceEnabledRef.current = voiceEnabled; }, [voiceEnabled]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const iv = setInterval(() => setScanY((p) => (p >= 100 ? 0 : p + 0.5)), 30);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setLocationStatus("GPS unavailable in browser");
      setLocationError("This browser does not support geolocation.");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const next = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        setCurrentPosition(next);
        setHomePosition((prev) => prev ?? next);
        setFlightPath((prev) => {
          const last = prev[prev.length - 1];
          const changed = !last || last[0] !== next.lat || last[1] !== next.lng;
          if (!changed) return prev;
          const nextPath: [number, number][] = [...prev, [next.lat, next.lng]];
          return nextPath.length > 120 ? nextPath.slice(nextPath.length - 120) : nextPath;
        });

        setLocationError(null);
        setLocationStatus("Live GPS tracking");
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setLocationStatus("Location permission denied");
          setLocationError("Allow location access to show your live position on the map.");
          return;
        }
        if (error.code === error.TIMEOUT) {
          setLocationStatus("GPS timeout");
          setLocationError("Timed out waiting for location update.");
          return;
        }
        setLocationStatus("GPS signal unavailable");
        setLocationError(error.message || "Unable to read device location.");
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 5000,
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  useEffect(() => {
    let active = true;

    const fetchNotifications = async () => {
      try {
        const response = await fetch("/api/device/state", { cache: "no-store" });
        if (!response.ok) return;
        const data = (await response.json()) as DeviceStatePayload;
        const next = deriveNotificationsFromState(data);
        if (!next.length) return;
        if (active) setNotifications(next);
      } catch {
        return;
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 3000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!isRecording) return;
    const id = window.setInterval(() => setRecordingSeconds((prev) => prev + 1), 1000);
    return () => window.clearInterval(id);
  }, [isRecording]);

  useEffect(() => {
    return () => {
      if (recorderRef.current && recorderRef.current.state !== "inactive") {
        recorderRef.current.stop();
      }
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
    if (isYouTubeEmbed) {
      setVideoStatus("YouTube embed mode: use a direct stream URL for REC");
      return;
    }

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
      const rec = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);

      chunksRef.current = [];
      recorderRef.current = rec;
      setRecordingSeconds(0);
      setIsRecording(true);
      setVideoStatus("Recording in progress");

      rec.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      rec.onerror = () => {
        setIsRecording(false);
        setVideoStatus("Recording failed");
      };

      rec.onstop = () => {
        setIsRecording(false);
        const type = rec.mimeType || "video/webm";
        const blob = new Blob(chunksRef.current, { type });
        chunksRef.current = [];
        if (blob.size > 0) {
          downloadBlob(blob, "drone-recording", "webm");
          setVideoStatus("Recording downloaded");
        } else {
          setVideoStatus("Recording empty, nothing downloaded");
        }
      };

      rec.start(1000);
    } catch {
      setIsRecording(false);
      setVideoStatus("Unable to start recording");
    }
  }, [downloadBlob, isYouTubeEmbed]);

  const handleRecordToggle = useCallback(() => {
    if (isRecording) {
      stopRecording();
      return;
    }
    void startRecording();
  }, [isRecording, startRecording, stopRecording]);

  const handleCapture = useCallback(async () => {
    if (isYouTubeEmbed) {
      setVideoStatus("YouTube embed mode: use a direct stream URL for CAPTURE");
      return;
    }

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

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, "image/png");
      });

      if (!blob) {
        setVideoStatus("Capture failed");
        return;
      }

      downloadBlob(blob, "drone-capture", "png");
      setVideoStatus("Capture downloaded");
    } catch {
      setVideoStatus("Capture blocked by stream security settings");
    }
  }, [downloadBlob, isYouTubeEmbed]);

  const handleAnalyze = useCallback(async () => {
    if (!analyzeQuery.trim() || isAnalyzing) return;
    setIsAnalyzing(true);
    setShowAnalyzeModal(false);
    setVideoStatus("Analyzing footage...");

    const id = ++idRef.current;
    setMessages((prev) => [...prev, { id, role: "user", text: `[ANALYZE] ${analyzeQuery}`, displayText: `[ANALYZE] ${analyzeQuery}` }]);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: analyzeQuery, mode: analyzeMode }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Analysis failed");
      }

      let responseText = "";
      if (json.type === "search" && Array.isArray(json.results)) {
        if (json.results.length === 0) {
          responseText = `Analysis complete. No matches found for "${analyzeQuery}" in the footage.`;
        } else {
          const matches = json.results.map((r: { start: number; end: number; score: number; confidence: string }, i: number) =>
            `${i + 1}. ${r.start.toFixed(1)}s - ${r.end.toFixed(1)}s (${(r.score * 100).toFixed(0)}% confidence: ${r.confidence})`
          ).join("\n");
          responseText = `Found ${json.results.length} match(es) for "${analyzeQuery}":\n${matches}`;
        }
      } else {
        responseText = json.data || "Analysis complete. No additional details returned.";
      }

      const aiId = ++idRef.current;
      setMessages((prev) => [...prev, { id: aiId, role: "ai", text: responseText, displayText: "" }]);
      let i = 0;
      const iv = setInterval(() => {
        i = Math.min(i + 2, responseText.length);
        setMessages((prev) =>
          prev.map((m) => (m.id === aiId ? { ...m, displayText: responseText.slice(0, i) } : m))
        );
        if (i >= responseText.length) clearInterval(iv);
      }, 18);

      setVideoStatus("Analysis complete");
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Analysis failed";
      const aiId = ++idRef.current;
      setMessages((prev) => [...prev, { id: aiId, role: "ai", text: `Analysis error: ${errMsg}`, displayText: `Analysis error: ${errMsg}` }]);
      setVideoStatus("Analysis failed");
    } finally {
      setIsAnalyzing(false);
      setAnalyzeQuery("");
    }
  }, [analyzeQuery, analyzeMode, isAnalyzing]);

  const speakText = useCallback((text: string, msgId: number) => {
    if (typeof window === "undefined" || !voiceEnabledRef.current) return;
    window.speechSynthesis.cancel();

    const utt = new SpeechSynthesisUtterance(text);
    utt.rate = 0.92;
    utt.pitch = 0.85;

    const pick = () => {
      const voices = window.speechSynthesis.getVoices();
      const en = voices.find((v) => v.name.toLowerCase().includes("google") && v.lang.startsWith("en"))
        ?? voices.find((v) => v.lang.startsWith("en"));
      if (en) utt.voice = en;
    };
    pick();
    if (!utt.voice) window.speechSynthesis.onvoiceschanged = pick;

    utt.onstart = () => { setIsSpeaking(true); setSpeakingId(msgId); };
    utt.onend   = () => { setIsSpeaking(false); setSpeakingId(null); };
    utt.onerror = () => { setIsSpeaking(false); setSpeakingId(null); };

    window.speechSynthesis.speak(utt);
  }, []);

  const addAIMessage = useCallback(
    (text: string) => {
      const id = ++idRef.current;
      setMessages((prev) => [...prev, { id, role: "ai", text, displayText: "" }]);

      let i = 0;
      const iv = setInterval(() => {
        i = Math.min(i + 2, text.length);
        setMessages((prev) =>
          prev.map((m) => (m.id === id ? { ...m, displayText: text.slice(0, i) } : m))
        );
        if (i >= text.length) {
          clearInterval(iv);
          speakText(text, id);
        }
      }, 18);
    },
    [speakText]
  );

  const runDemoThinking = useCallback(async (text: string) => {
    const steps = pickDemoSequence(text).map((toolName, index) => ({
      key: `${toolName}-${index}`,
      label: AGENT_TOOL_LABELS[toolName] || toolName,
      toolName,
      status: "pending" as const,
    }));
    setThinkingSteps(steps.map(({ key, label, status }) => ({ key, label, status })));
    setAgentStatus("Simulated agent tool loop");
    setIsThinking(true);

    for (const step of steps) {
      const isAction = ACTION_TOOLS.has(step.toolName);
      setAgentStatus(isAction ? "Preparing flight action" : "Analyzing with tools");
      await sleep(isAction ? DEMO_ACTION_DELAY_MS : DEMO_STEP_DELAY_MS);
      setThinkingSteps((prev) =>
        prev.map((item) => ({
          ...item,
          status: item.key === step.key ? "active" : item.status === "active" ? "done" : item.status,
        }))
      );
      await sleep(isAction ? Math.max(420, Math.floor(DEMO_ACTION_DELAY_MS * 0.6)) : Math.max(260, Math.floor(DEMO_STEP_DELAY_MS * 0.45)));
      setThinkingSteps((prev) => prev.map((item) => (item.key === step.key ? { ...item, status: "done" } : item)));
    }

    await sleep(220);
    setIsThinking(false);
    setAgentStatus("");
  }, []);

  const runRealAgentThinking = useCallback(async (text: string): Promise<string> => {
    setThinkingSteps([]);
    setAgentStatus("Live agent tool loop");
    setIsThinking(true);

    const response = await fetch("/api/agent/stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ goal: text }),
    });

    if (!response.ok || !response.body) {
      throw new Error(`Agent stream unavailable (${response.status})`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let finalMessage = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line) continue;
        let event: AgentStreamEvent;
        try {
          event = JSON.parse(line) as AgentStreamEvent;
        } catch {
          continue;
        }

        if (event.type === "session_start") {
          setAgentStatus("Agent session started");
          continue;
        }

        if (event.type === "tool_call" && event.toolName) {
          if (event.status === "queued") {
            setQueuedToolStep(event.toolName);
          } else if (event.status === "running") {
            setActiveToolStep(event.toolName);
          } else {
            setActiveToolStep(event.toolName);
          }
          continue;
        }

        if (event.type === "tool_result" && event.toolName) {
          finalizeToolStep(event.toolName, event.result?.ok === false ? "error" : "done");
          continue;
        }

        if (event.type === "mode_fallback") {
          setAgentStatus("Tool API unavailable, using fallback planner");
          continue;
        }

        if (event.type === "assistant_final" && event.finalMessage) {
          finalMessage = event.finalMessage;
          continue;
        }

        if (event.type === "error") {
          throw new Error(event.error || "Agent stream failed");
        }

        if (event.type === "result" && event.finalMessage) {
          finalMessage = event.finalMessage;
        }
      }
    }

    setIsThinking(false);
    setAgentStatus("");
    return finalMessage;
  }, [finalizeToolStep, setActiveToolStep, setQueuedToolStep]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isAgentRunning) return;
      setIsAgentRunning(true);
      const id = ++idRef.current;
      setMessages((prev) => [...prev, { id, role: "user", text, displayText: text }]);
      setInput("");
      setTranscript("");

      try {
        let finalText = "";
        if (USE_REAL_AGENT_STREAM) {
          finalText = await runRealAgentThinking(text);
        } else {
          await runDemoThinking(text);
        }
        addAIMessage(finalText || getResponse(text));
      } catch {
        await runDemoThinking(text);
        addAIMessage(getResponse(text));
      } finally {
        setIsThinking(false);
        setAgentStatus("");
        setIsAgentRunning(false);
      }
    },
    [addAIMessage, isAgentRunning, runDemoThinking, runRealAgentThinking]
  );

  const toggleVoice = useCallback(() => {
    setVoiceEnabled((prev) => {
      if (prev) {
        window.speechSynthesis?.cancel();
        setIsSpeaking(false);
        setSpeakingId(null);
      }
      return !prev;
    });
  }, []);

  const startListening = useCallback(() => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechAPI = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;

    if (!SpeechAPI) {
      setIsListening(true);
      setTranscript("Search the area around sector 3…");
      setTimeout(() => {
        setIsListening(false);
        sendMessage("Search the area around sector 3");
      }, 2200);
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rec: any = new SpeechAPI();
    recognitionRef.current = rec;
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = "en-US";

    rec.onstart = () => { setIsListening(true); setTranscript(""); };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (e: any) => {
      const result = e.results[e.results.length - 1];
      const t = result[0].transcript;
      setTranscript(t);
      if (result.isFinal) {
        setIsListening(false);
        sendMessage(t);
      }
    };
    rec.onerror = () => { setIsListening(false); setTranscript(""); };
    rec.onend   = () => setIsListening(false);
    rec.start();
  }, [sendMessage]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
    setTranscript("");
  }, []);

  const gpsTelemetry = currentPosition
    ? `${formatCoordinate(currentPosition.lat, "N", "S")}, ${formatCoordinate(currentPosition.lng, "E", "W")}`
    : "Acquiring lock...";

  const gpsHud = currentPosition
    ? `${currentPosition.lat.toFixed(5)}° ${currentPosition.lat >= 0 ? "N" : "S"} ${currentPosition.lng.toFixed(5)}° ${currentPosition.lng >= 0 ? "E" : "W"}`
    : "Locating...";

  return (
    <div className="fixed left-0 right-0 top-14 bottom-0 bg-[#0F141D] flex flex-col overflow-hidden">
      {/* Sub-header */}
      <div className="border-b border-[#2B3342] bg-[#141A24] px-4 lg:px-6 py-3 flex items-center justify-between shrink-0">
        <h1 className="text-sm font-semibold tracking-[0.14em] uppercase text-[#F4F7FC]">SkySearch Control</h1>
        <div className="flex items-center gap-3">
          {/* Mobile tab switcher */}
          <div className="flex lg:hidden border border-[#2B3342] bg-[#111722] p-0.5 gap-0.5 rounded-sm">
            <button
              onClick={() => setMobileTab("control")}
              className={`px-3 py-2 text-[13px] font-mono tracking-wider transition-all ${mobileTab === "control" ? "bg-[#2D384A] text-[#F4F7FC]" : "text-[#A3ADBC] hover:text-[#CFD6E3]"}`}
            >
              CONTROL
            </button>
            <button
              onClick={() => setMobileTab("status")}
              className={`px-3 py-2 text-[13px] font-mono tracking-wider transition-all ${mobileTab === "status" ? "bg-[#2D384A] text-[#F4F7FC]" : "text-[#A3ADBC] hover:text-[#CFD6E3]"}`}
            >
              STATUS
            </button>
          </div>
          {isSpeaking && (
            <div className="hidden lg:flex items-center gap-2">
              <WaveformBars active bars={7} color="#B6C2D5" />
              <span className="text-[12px] font-mono text-[#A3ADBC] tracking-wider">AI SPEAKING</span>
            </div>
          )}
          <span className="w-1.5 h-1.5 bg-[#22C55E]" />
          <span className="hidden sm:block text-[13px] text-[#A3ADBC] font-mono tracking-wider">
            DJI MAVIC 3 PRO
          </span>
          <span className="hidden md:block text-[12px] text-[#8B96A8] font-mono tracking-wider uppercase">
            AGENT {USE_REAL_AGENT_STREAM ? "REAL" : "DEMO"}
          </span>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_320px] min-h-0">
        {/* LEFT COLUMN */}
        <div className={`flex-col border-r border-[#2B3342] overflow-hidden ${mobileTab === "control" ? "flex" : "hidden"} lg:flex`}>

          {/* Video Feed */}
          <div className="relative bg-[#131A26] m-2 lg:m-3 border border-[#2B3342] overflow-hidden shrink-0 h-[28%] lg:h-[42%]">
            <div
              className="absolute left-0 right-0 h-px bg-[#CDFF00]/15"
              style={{ top: `${scanY}%` }}
            />
            {/* Corner brackets */}
            <div className="absolute top-3 left-3 w-6 h-6 border-t border-l border-[#3B4658]" />
            <div className="absolute top-3 right-3 w-6 h-6 border-t border-r border-[#3B4658]" />
            <div className="absolute bottom-10 left-3 w-6 h-6 border-b border-l border-[#3B4658]" />
            <div className="absolute bottom-10 right-3 w-6 h-6 border-b border-r border-[#3B4658]" />
            {/* Background video */}
            {isYouTubeEmbed ? (
              <iframe
                src={videoConfig.youtubeEmbedUrl!}
                title="Drone YouTube live stream"
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 w-full h-full border-0 opacity-60"
                onLoad={() => {
                  setStreamError(null);
                  setVideoStatus("YouTube live stream connected");
                }}
              />
            ) : (
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
            )}
            {/* HUD bar */}
            <div className="absolute bottom-0 left-0 right-0 bg-[#0F141D]/95 border-t border-[#2B3342] px-3 py-2 flex items-center gap-5">
              <span className="text-[12px] font-mono text-[#A3ADBC]">ALT 45.2m</span>
              <span className="text-[12px] font-mono text-[#A3ADBC]">SPD 12km/h</span>
              <span className="text-[12px] font-mono text-[#A3ADBC]">GPS {gpsHud}</span>
              <span className="text-[12px] font-mono text-[#CDFF00] ml-auto">AI: ACTIVE</span>
              <span className="text-[12px] font-mono text-[#A3ADBC]">
                FEED {videoConfig.isRealFeedActive ? (isYouTubeEmbed ? "REAL-YT" : "REAL") : "DEMO"}
              </span>
              <span className="text-[12px] font-mono text-[#F87171] flex items-center gap-1">
                <span className="w-1 h-1 bg-red-500" />
                {isRecording ? `REC ${formatDuration(recordingSeconds)}` : "REC OFF"}
              </span>
            </div>
          </div>

          {/* Video controls */}
          <div className="px-2 lg:px-3 pb-1 lg:pb-2 flex gap-1.5 shrink-0">
            <button
              onClick={handleRecordToggle}
              className="border border-[#2B3342] bg-[#141A24] px-3 py-2 text-[13px] font-mono text-[#F87171] hover:bg-[#1A2231] transition-colors tracking-wider"
            >
              {isRecording ? "STOP" : "REC"}
            </button>
            <button
              onClick={handleCapture}
              className="border border-[#2B3342] bg-[#141A24] px-3 py-2 text-[13px] font-mono text-[#CFD6E3] hover:bg-[#1A2231] transition-colors tracking-wider"
            >
              CAPTURE
            </button>
            <button className="border border-[#2B3342] bg-[#141A24] px-3 py-2 text-[13px] font-mono text-[#CDFF00] hover:bg-[#1A2231] transition-colors tracking-wider">
              AI: ON
            </button>
          </div>
          <div className="px-2 lg:px-3 pb-2">
            <p className="text-[12px] font-mono text-[#8EA0BA] tracking-wide">{videoStatus}</p>
            {streamError && <p className="text-[12px] font-mono text-[#F87171] mt-1">{streamError}</p>}
          </div>

          {/* LLM Chat */}
          <div className="flex-1 flex flex-col m-2 mt-1 lg:m-3 lg:mt-1 border border-[#2B3342] bg-[#111722] overflow-hidden min-h-0">

            {/* Chat header */}
            <div className="px-4 py-3 border-b border-[#2B3342] bg-[#151D2A] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <h3 className="text-[13px] font-semibold tracking-[0.15em] uppercase text-[#F4F7FC]">Command Center</h3>
                {isSpeaking && (
                  <div className="flex items-center gap-1.5">
                    <WaveformBars active bars={5} color="#B6C2D5" />
                    <span className="text-[11px] font-mono text-[#A3ADBC] tracking-wider">SPEAKING</span>
                  </div>
                )}
              </div>

              <button
                onClick={toggleVoice}
                title={voiceEnabled ? "Mute AI voice" : "Unmute AI voice"}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-mono tracking-wider transition-all ${
                  voiceEnabled
                    ? "bg-[#2D384A] text-[#F4F7FC]"
                    : "text-[#A3ADBC] hover:text-[#CFD6E3]"
                }`}
              >
                VOICE {voiceEnabled ? "ON" : "OFF"}
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`border border-[#2B3342] bg-[#151D2A] p-3 max-w-[85%] ${
                    msg.role === "ai"
                      ? "border-l-2 border-l-[#3F4C62] mr-auto"
                      : "border-l-2 border-l-[#7B879A] ml-auto"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-[12px] font-mono text-[#A3ADBC] tracking-wider">
                      {msg.role === "ai" ? "SKYSEARCH AI" : "OPERATOR"}
                    </p>
                    {msg.role === "ai" && speakingId === msg.id && (
                      <WaveformBars active bars={4} color="#B6C2D5" />
                    )}
                  </div>
                  <p className="text-sm text-[#CFD6E3] leading-relaxed">
                    {msg.displayText}
                    {msg.role === "ai" && msg.displayText.length < msg.text.length && (
                      <span className="inline-block w-0.5 h-3 bg-[#A3ADBC] ml-0.5 align-middle animate-pulse" />
                    )}
                  </p>
                </div>
              ))}

              {isThinking && (
                <div className="border border-[#2B3342] bg-[#151D2A] border-l-2 border-l-[#4D5C74] p-3 max-w-[88%] mr-auto">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-[12px] font-mono text-[#A3ADBC] tracking-wider">AGENT THINKING</p>
                    <WaveformBars active bars={4} color="#B6C2D5" />
                    <span className="text-[12px] text-[#CFD6E3]">{agentStatus || "Processing"}</span>
                  </div>
                  <div className="space-y-1.5">
                    {thinkingSteps.map((step) => (
                      <div key={step.key} className="flex items-center gap-2 text-[13px]">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            step.status === "done"
                              ? "bg-[#22C55E]"
                              : step.status === "error"
                                ? "bg-[#F87171]"
                                : "bg-[#B6C2D5] animate-pulse"
                          }`}
                        />
                        <span
                          className={`font-mono ${
                            step.status === "done"
                              ? "text-[#D7E0ED]"
                              : step.status === "error"
                                ? "text-[#FCA5A5]"
                                : "text-[#AFC0D7]"
                          }`}
                        >
                          {step.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Input area */}
            <div className="p-3 border-t border-[#2B3342] bg-[#141B28] shrink-0">

              {(isListening || transcript) && (
                <div className="mb-2 px-3 py-2 border border-[#2B3342] bg-[#172031] flex items-center gap-2.5">
                  <WaveformBars active={isListening} bars={6} color="#B6C2D5" />
                  <span className="text-[13px] text-[#CFD6E3] font-mono flex-1 truncate">
                    {isListening && !transcript ? "Listening…" : transcript || "Processing…"}
                  </span>
                  {isListening && (
                    <button
                      onClick={stopListening}
                      className="text-[11px] font-mono text-[#A3ADBC] hover:text-[#F4F7FC] transition-colors tracking-wider"
                    >
                      STOP
                    </button>
                  )}
                </div>
              )}

              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={input}
                  disabled={isAgentRunning}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
                  placeholder="Type a command…"
                  className="flex-1 bg-[#0F141D] border border-[#2B3342] px-4 py-3 text-sm text-[#F4F7FC] placeholder:text-[#8B96A8] focus:outline-none focus:border-[#4D5C74] disabled:opacity-60"
                />

                <button
                  onClick={isListening ? stopListening : startListening}
                  disabled={isAgentRunning}
                  title={isListening ? "Stop listening" : "Start voice command"}
                  className={`w-10 h-10 flex items-center justify-center transition-all ${
                    isListening
                      ? "bg-[#F4F7FC]"
                      : "bg-[#2D384A] hover:bg-[#3B4658]"
                  } disabled:opacity-60`}
                >
                  {isListening ? (
                    <WaveformBars active bars={5} color="#0F141D" />
                  ) : (
                    <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#E3EAF7]" fill="currentColor">
                      <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                      <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                    </svg>
                  )}
                </button>

                <button
                  onClick={() => sendMessage(input)}
                  disabled={isAgentRunning}
                  className="w-10 h-10 bg-[#F4F7FC] flex items-center justify-center hover:bg-white transition-colors disabled:opacity-60"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#0F141D]" fill="currentColor">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                  </svg>
                </button>
              </div>

              <div className="hidden sm:flex gap-1.5 mt-2 overflow-x-auto pb-1">
                {quickCommands.map((cmd) => (
                  <button
                    key={cmd}
                    onClick={() => sendMessage(cmd)}
                    disabled={isAgentRunning}
                    className="border border-[#2B3342] bg-[#141B28] px-3 py-2 text-[13px] font-mono text-[#A3ADBC] hover:text-[#F4F7FC] hover:border-[#4D5C74] transition-colors whitespace-nowrap shrink-0 tracking-wider disabled:opacity-50"
                  >
                    {cmd}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className={`flex-col overflow-y-auto ${mobileTab === "status" ? "flex" : "hidden"} lg:flex`}>

          {/* Analyze Button */}
          <div className="p-4 pb-2">
            <button
              onClick={() => setShowAnalyzeModal(true)}
              disabled={isAnalyzing}
              className="w-full py-3 bg-[#3B82F6] hover:bg-[#2563EB] text-white text-[13px] font-semibold font-mono tracking-[0.15em] uppercase transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}>
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              {isAnalyzing ? "ANALYZING..." : "ANALYZE FOOTAGE"}
            </button>
          </div>

          {/* Telemetry */}
          <div className="p-4">
            <h3 className="text-[12px] font-semibold text-[#A3ADBC] uppercase tracking-[0.18em] mb-4">
              Telemetry
            </h3>
            <div className="border border-[#2B3342] bg-[#131A26] p-4 space-y-4">
              <div>
                <div className="flex justify-between text-[13px] mb-1.5">
                  <span className="text-[#A3ADBC] font-mono">BATTERY</span>
                  <span className="font-mono text-[#EDEDED]">78%</span>
                </div>
                <div className="w-full h-1.5 bg-[#2B3342]">
                  <div className="h-full w-[78%] bg-[#22C55E]" />
                </div>
              </div>
              {[
                { label: "ALTITUDE",    value: "45.2m" },
                { label: "SPEED",       value: "12 km/h" },
                { label: "GPS",         value: gpsTelemetry },
                { label: "SIGNAL",      value: "Strong" },
                { label: "TEMP",        value: "32\u00B0C" },
                { label: "FLIGHT TIME", value: "00:14:32" },
              ].map((item) => (
                <div key={item.label} className="flex justify-between text-[13px]">
                  <span className="text-[#A3ADBC] font-mono">{item.label}</span>
                  <span className="font-mono text-[#EDEDED]">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* GPS Map */}
          <div className="px-4 pb-4">
            <h3 className="text-[12px] font-semibold text-[#A3ADBC] uppercase tracking-[0.18em] mb-4">
              GPS Tracker
            </h3>
            <div className="border border-[#2B3342] bg-[#131A26] overflow-hidden">
              <div className="h-[220px] bg-[#0F141D]">
                <LiveGpsMap
                  currentPosition={currentPosition}
                  homePosition={homePosition}
                  flightPath={flightPath}
                />
              </div>
              <div className="px-3 py-2 border-t border-[#2B3342] bg-[#151D2A] flex items-center justify-between">
                <span className="text-[11px] font-mono text-[#A3ADBC] tracking-wider">{locationStatus}</span>
                <span className="text-[11px] font-mono text-[#CFD6E3]">
                  {currentPosition
                    ? `${formatCoordinate(currentPosition.lat, "N", "S")} ${formatCoordinate(currentPosition.lng, "E", "W")}`
                    : "Waiting for coordinates"}
                </span>
              </div>
              {locationError && (
                <div className="px-3 py-2 border-t border-[#2B3342] bg-[#131A26] text-[12px] font-mono text-[#F59E0B]">
                  {locationError}
                </div>
              )}
            </div>
          </div>

          {/* AI Status */}
          <div className="px-4 pb-4">
            <h3 className="text-[12px] font-semibold text-[#A3ADBC] uppercase tracking-[0.18em] mb-4">
              AI Status
            </h3>
            <div className="border border-[#2B3342] bg-[#131A26] p-4 space-y-3">
              {[
                { label: "MODEL",            value: "Active",   accent: "#22C55E" },
                { label: "FACES DB",         value: "12 loaded", accent: "#22C55E" },
                { label: "OBJECTS DETECTED", value: "847",       accent: "#CDFF00" },
                { label: "AREA SCANNED",     value: "3.2 km\u00B2", accent: "#CDFF00" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between text-[13px]">
                  <div className="flex items-center gap-2">
                    <span className="w-1 h-1" style={{ backgroundColor: item.accent }} />
                    <span className="text-[#A3ADBC] font-mono">{item.label}</span>
                  </div>
                  <span className="font-mono text-[#EDEDED]">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Notifications */}
          <div className="px-4 pb-4 flex-1">
            <h3 className="text-[12px] font-semibold text-[#A3ADBC] uppercase tracking-[0.18em] mb-4">
              Events
            </h3>
            <div className="border border-[#2B3342] bg-[#131A26] p-4 space-y-3">
              {notifications.map((n) => (
                <div key={n.id} className="flex gap-3 text-[13px] leading-relaxed">
                  <span className="font-mono text-[#8B96A8] shrink-0">{n.time}</span>
                  <span className="w-1 h-1 mt-1.5 shrink-0" style={{ backgroundColor: n.accent }} />
                  <span className="text-[#CFD6E3]">{n.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Analyze Modal */}
      {showAnalyzeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-[420px] border border-[#2B3342] bg-[#141A24] shadow-2xl">
            <div className="px-5 py-4 border-b border-[#2B3342] flex items-center justify-between">
              <h3 className="text-[13px] font-semibold tracking-[0.15em] uppercase text-[#F4F7FC]">
                Video Analysis
              </h3>
              <button
                onClick={() => setShowAnalyzeModal(false)}
                className="text-[#A3ADBC] hover:text-[#F4F7FC] text-lg leading-none"
              >
                &times;
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-[12px] font-mono text-[#A3ADBC] tracking-wider mb-2">
                  WHAT DO YOU WANT TO FIND / ANALYZE?
                </label>
                <input
                  type="text"
                  value={analyzeQuery}
                  onChange={(e) => setAnalyzeQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
                  placeholder="e.g. Find people, detect fire, describe the scene..."
                  autoFocus
                  className="w-full bg-[#0F141D] border border-[#2B3342] px-4 py-3 text-sm text-[#F4F7FC] placeholder:text-[#8B96A8] focus:outline-none focus:border-[#4D5C74]"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setAnalyzeMode("analyze")}
                  className={`flex-1 py-2 text-[12px] font-mono tracking-wider border transition-colors ${
                    analyzeMode === "analyze"
                      ? "border-[#3B82F6] bg-[#3B82F6]/10 text-[#3B82F6]"
                      : "border-[#2B3342] text-[#A3ADBC] hover:text-[#CFD6E3]"
                  }`}
                >
                  ANALYZE
                </button>
                <button
                  onClick={() => setAnalyzeMode("search")}
                  className={`flex-1 py-2 text-[12px] font-mono tracking-wider border transition-colors ${
                    analyzeMode === "search"
                      ? "border-[#CDFF00] bg-[#CDFF00]/10 text-[#CDFF00]"
                      : "border-[#2B3342] text-[#A3ADBC] hover:text-[#CFD6E3]"
                  }`}
                >
                  SEARCH
                </button>
              </div>

              <p className="text-[11px] font-mono text-[#8B96A8]">
                {analyzeMode === "analyze"
                  ? "Analyze will describe and interpret the footage using AI."
                  : "Search will find specific moments matching your query."}
              </p>
            </div>

            <div className="px-5 py-4 border-t border-[#2B3342] flex justify-end gap-2">
              <button
                onClick={() => setShowAnalyzeModal(false)}
                className="px-4 py-2 text-[13px] font-mono text-[#A3ADBC] hover:text-[#F4F7FC] tracking-wider"
              >
                CANCEL
              </button>
              <button
                onClick={handleAnalyze}
                disabled={!analyzeQuery.trim()}
                className="px-5 py-2 text-[13px] font-mono bg-[#3B82F6] text-white hover:bg-[#2563EB] transition-colors tracking-wider disabled:opacity-40"
              >
                RUN ANALYSIS
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
