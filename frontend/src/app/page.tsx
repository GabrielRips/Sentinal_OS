"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useCallback } from "react";
import FadeIn from "@/components/FadeIn";

/* ════════════════════════════════════════════
   GLITCH TEXT
   ════════════════════════════════════════════ */

const glitchChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*<>{}[]=/\\|";

function GlitchText({
  text,
  className,
  style,
  intervalMs = 3000,
  scrambleDurationMs = 800,
}: {
  text: string;
  className?: string;
  style?: React.CSSProperties;
  intervalMs?: number;
  scrambleDurationMs?: number;
}) {
  const [display, setDisplay] = useState(text);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    const scramble = () => {
      const startTime = performance.now();
      const chars = text.split("");

      const tick = () => {
        const elapsed = performance.now() - startTime;
        const progress = Math.min(elapsed / scrambleDurationMs, 1);
        // Characters resolve left to right as progress increases
        const resolvedCount = Math.floor(progress * chars.length);

        const result = chars.map((ch, i) => {
          if (ch === " " || ch === "\n") return ch;
          if (i < resolvedCount) return ch;
          return glitchChars[Math.floor(Math.random() * glitchChars.length)];
        });

        setDisplay(result.join(""));

        if (progress < 1) {
          frameRef.current = requestAnimationFrame(tick);
        } else {
          setDisplay(text);
          timeout = setTimeout(scramble, intervalMs);
        }
      };

      frameRef.current = requestAnimationFrame(tick);
    };

    timeout = setTimeout(scramble, intervalMs);

    return () => {
      clearTimeout(timeout);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [text, intervalMs, scrambleDurationMs]);

  return (
    <span className={className} style={style}>
      {display}
    </span>
  );
}

/* ════════════════════════════════════════════
   BOOT SEQUENCE
   ════════════════════════════════════════════ */

const bootLines = [
  "[0.000] SENTINEL OS v1.0.3 — kernel init",
  "[0.012] loading neural engine .............. OK",
  "[0.034] mounting vision pipeline (YOLOv8x) . OK",
  "[0.051] face recognition db: 12 profiles ... OK",
  "[0.067] speech synthesis ................... OK",
  "[0.083] flight controller handshake ........ OK",
  "[0.094] DJI SDK bridge .................... OK",
  "[0.108] GPS lock acquired: 48.85°N 2.35°E . OK",
  "[0.119] telemetry stream .................. LIVE",
  "[0.131] obstacle avoidance ................ ARMED",
  "[0.142] AI reasoning engine (Claude) ...... READY",
  "[0.156] ═══════════════════════════════════════",
  "[0.156] ALL SYSTEMS NOMINAL — READY FOR MISSION",
];

function BootSequence({ onComplete }: { onComplete: () => void }) {
  const [lines, setLines] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    let i = 0;
    const iv = setInterval(() => {
      if (i < bootLines.length) {
        setLines((prev) => [...prev, bootLines[i]]);
        i++;
      } else {
        clearInterval(iv);
        setTimeout(() => setFadeOut(true), 400);
        setTimeout(() => { setDone(true); onComplete(); }, 1000);
      }
    }, 120);
    return () => clearInterval(iv);
  }, [onComplete]);

  if (done) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-[#050505] flex items-center justify-center boot-scanline"
      style={{ opacity: fadeOut ? 0 : 1, transition: "opacity 0.6s ease-out" }}
    >
      <div className="w-full max-w-2xl px-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="w-2 h-2 bg-[#CDFF00]" />
          <span className="text-[11px] font-mono tracking-[0.3em] text-[#CDFF00]/70 uppercase">
            System Initialize
          </span>
        </div>
        <div className="font-mono text-[11px] leading-[1.8]">
          {lines.map((line, i) => (
            <div
              key={i}
              style={{
                animation: "fade-in-up 0.15s ease-out forwards",
                color: line.includes("READY FOR MISSION") ? "#CDFF00"
                  : line.includes("OK") || line.includes("LIVE") || line.includes("ARMED") || line.includes("READY") ? "#AAA"
                  : "#666",
              }}
            >
              {line}
            </div>
          ))}
          {lines.length < bootLines.length && (
            <span className="inline-block w-2 h-3.5 bg-[#CDFF00]/70 animate-pulse" />
          )}
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   AMBIENT DATA STREAMS
   ════════════════════════════════════════════ */

function DataStream({ side }: { side: "left" | "right" }) {
  const dataPoints = Array.from({ length: 40 }, (_, i) => {
    const types = [
      () => `${(48.85 + Math.random() * 0.01).toFixed(4)}°N ${(2.35 + Math.random() * 0.01).toFixed(4)}°E`,
      () => `ALT ${(40 + Math.random() * 15).toFixed(1)}m`,
      () => `OBJ_${String(Math.floor(Math.random() * 999)).padStart(3, "0")} CONF:${(70 + Math.random() * 29).toFixed(0)}%`,
      () => `SPD ${(8 + Math.random() * 12).toFixed(1)} km/h`,
      () => `SECTOR ${["A", "B", "C", "D"][Math.floor(Math.random() * 4)]}-${Math.floor(Math.random() * 9) + 1}`,
    ];
    return types[i % types.length]();
  });

  return (
    <div
      className={`fixed top-0 bottom-0 w-[140px] z-[5] pointer-events-none overflow-hidden hidden xl:block ${side === "left" ? "left-0" : "right-0"}`}
      style={{ maskImage: "linear-gradient(to bottom, transparent 5%, black 20%, black 80%, transparent 95%)", WebkitMaskImage: "linear-gradient(to bottom, transparent 5%, black 20%, black 80%, transparent 95%)" }}
    >
      <div className="data-stream">
        {[...dataPoints, ...dataPoints].map((d, i) => (
          <div key={i} className={`text-[8px] font-mono py-1 px-4 ${side === "left" ? "text-left" : "text-right"}`}
            style={{ color: d.includes("CONF:9") ? "rgba(205,255,0,0.3)" : "rgba(120,120,120,0.35)" }}
          >
            {d}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   LIVE CLOCK
   ════════════════════════════════════════════ */

function LiveClock() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const update = () => setTime(new Date().toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    update();
    const iv = setInterval(update, 1000);
    return () => clearInterval(iv);
  }, []);
  return <>{time}</>;
}

/* ════════════════════════════════════════════
   INTERACTIVE COMMAND DEMO
   ════════════════════════════════════════════ */

const demoResponses: Record<string, string> = {
  search: "Copy. Initiating grid search pattern over the designated area. Altitude set to 45m for optimal coverage. Scanning sector A-1. I'll alert you the moment I detect anything.",
  find: "Activating facial recognition. Cross-referencing 12 loaded profiles against the live feed. Expanding search radius to 200m. Stay close — I'll call it out when I get a match.",
  photo: "High-resolution photo captured. Resolution: 5472×3648. Image saved and sent to your device. GPS coordinates tagged: 48.8512°N, 2.3508°E.",
  return: "Return to home confirmed. Plotting optimal path — distance 320m, ETA 45 seconds. Descending to 30m for obstacle clearance. Landing zone is clear.",
  hover: "Holding position. Altitude: 45.2m. Wind compensation active — 8 km/h NW. Stable hover confirmed. I'll stay right here until your next command.",
  land: "Landing sequence initiated. Scanning landing zone... clear. Descending at 1.5 m/s. Motors will cut at ground contact. Stand clear.",
  scan: "Switching to expanded scan mode. Search radius increased to 500m. Activating visual spectrum analysis. Estimated full-area coverage in 8 minutes.",
  sport: "Sports filming mode engaged. AI is tracking player movement and ball position. Camera set to cinematic mode at 4K 60fps. Auto-highlight detection is active.",
  hello: "SkySearch AI online and ready. All systems nominal. What's the mission?",
  help: "Available commands: search, find, photo, return home, hover, land, scan area, sport mode. You can also speak naturally — I understand context.",
};

function getDemo(input: string): string {
  const lower = input.toLowerCase();
  for (const [key, resp] of Object.entries(demoResponses)) {
    if (lower.includes(key)) return resp;
  }
  return "Command acknowledged. Processing your request — adjusting flight parameters and updating mission objectives. Monitoring for targets. I'll keep you updated.";
}

function InteractiveDemo() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: "user" | "ai"; text: string; displayText: string }[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = useCallback((text: string) => {
    if (!text.trim() || isTyping) return;
    const userMsg = text.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: userMsg, displayText: userMsg }]);
    setIsTyping(true);

    const response = getDemo(userMsg);
    setTimeout(() => {
      setMessages((prev) => [...prev, { role: "ai", text: response, displayText: "" }]);
      let i = 0;
      const iv = setInterval(() => {
        i = Math.min(i + 2, response.length);
        setMessages((prev) =>
          prev.map((m, idx) => idx === prev.length - 1 ? { ...m, displayText: response.slice(0, i) } : m)
        );
        if (i >= response.length) {
          clearInterval(iv);
          setIsTyping(false);
        }
      }, 15);
    }, 500);
  }, [isTyping]);

  const quickCmds = ["Search the north field", "Find my friend", "Take a photo", "Return home"];

  return (
    <div className="border border-[#1A1A1A] bg-[#0A0A0A] max-w-2xl mx-auto">
      {/* Header */}
      <div className="px-5 py-3 border-b border-[#1A1A1A] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-[#22C55E] animate-pulse-dot" />
          <span className="text-[10px] font-mono text-[#AAA] tracking-wider uppercase">SkySearch AI</span>
        </div>
        <span className="text-[9px] font-mono text-[#777] tracking-wider">INTERACTIVE DEMO</span>
      </div>

      {/* Chat area */}
      <div ref={chatRef} className="h-[260px] overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="h-full flex items-center justify-center">
            <p className="text-sm text-[#777] text-center">
              Type a command below or click a quick action.
              <br />
              <span className="text-[#999]">Try: &ldquo;search the area&rdquo; or &ldquo;find my friend&rdquo;</span>
            </p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`${msg.role === "ai" ? "border-l-2 border-l-[#CDFF00]/40 bg-[#111] pl-4 pr-3 py-2.5 mr-6" : "border-l-2 border-l-[#666] pl-4 pr-3 py-2.5 ml-6"}`}>
            <p className="text-[9px] font-mono text-[#888] tracking-wider mb-1">
              {msg.role === "ai" ? "SKYSEARCH AI" : "YOU"}
            </p>
            <p className="text-[13px] text-[#CCC] leading-relaxed">
              {msg.displayText}
              {msg.role === "ai" && msg.displayText.length < msg.text.length && (
                <span className="inline-block w-0.5 h-3.5 bg-[#CDFF00] ml-0.5 align-middle animate-pulse" />
              )}
            </p>
          </div>
        ))}
      </div>

      {/* Quick commands */}
      <div className="px-4 pb-2 flex gap-2 flex-wrap">
        {quickCmds.map((cmd) => (
          <button
            key={cmd}
            onClick={() => send(cmd)}
            className="border border-[#2A2A2A] px-3 py-1.5 text-[10px] font-mono text-[#AAA] hover:text-[#EDEDED] hover:border-[#CDFF00]/30 hover:bg-[#CDFF00]/5 transition-all tracking-wider"
          >
            {cmd}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-[#1A1A1A] flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send(input)}
          placeholder="Type a command to the drone..."
          className="flex-1 bg-[#111] border border-[#2A2A2A] px-4 py-3 text-sm text-[#EDEDED] placeholder:text-[#666] focus:outline-none focus:border-[#CDFF00]/40 transition-colors font-mono"
        />
        <button
          onClick={() => send(input)}
          className="px-4 py-3 bg-[#CDFF00] text-[#0A0A0A] font-bold text-xs tracking-wider hover:bg-[#d8ff33] transition-colors"
        >
          SEND
        </button>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   BENTO TILES — Live Feed
   ════════════════════════════════════════════ */

const detectionSets = [
  [{ label: "CAR", confidence: 87, top: 68, left: 57, w: 3.3, h: 5.7, color: "#F59E0B" }],
  [
    { label: "CAR", confidence: 91, top: 82, left: 81, w: 4.5, h: 5.2, color: "#F59E0B" },
    { label: "CAR", confidence: 84, top: 68, left: 65, w: 2.9, h: 3.6, color: "#F59E0B" },
  ],
  [
    { label: "CAR", confidence: 89, top: 68, left: 57, w: 3.3, h: 5.7, color: "#F59E0B" },
    { label: "BUS", confidence: 82, top: 70, left: 43, w: 5, h: 4, color: "#3B82F6" },
  ],
  [{ label: "CAR", confidence: 93, top: 82, left: 81, w: 4.5, h: 5.2, color: "#F59E0B" }],
  [
    { label: "CAR", confidence: 86, top: 68, left: 65, w: 2.9, h: 3.6, color: "#F59E0B" },
    { label: "CAR", confidence: 90, top: 75, left: 52, w: 3.5, h: 4.8, color: "#F59E0B" },
  ],
];

function LiveFeedTile() {
  const [scanY, setScanY] = useState(0);
  const [detIdx, setDetIdx] = useState(0);
  const [recTime, setRecTime] = useState(0);
  const [flash, setFlash] = useState(false);

  useEffect(() => { const iv = setInterval(() => setScanY((p) => (p >= 100 ? 0 : p + 0.5)), 30); return () => clearInterval(iv); }, []);
  useEffect(() => { const iv = setInterval(() => setRecTime((p) => p + 1), 1000); return () => clearInterval(iv); }, []);
  useEffect(() => {
    const iv = setInterval(() => {
      setDetIdx((p) => {
        const next = (p + 1) % detectionSets.length;
        if (detectionSets[next].some((d) => d.confidence > 90)) { setFlash(true); setTimeout(() => setFlash(false), 1500); }
        return next;
      });
    }, 7000);
    return () => clearInterval(iv);
  }, []);

  const dets = detectionSets[detIdx];
  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className={`bento-tile row-span-2 relative group ${flash ? "alert-flash" : ""}`}>
      <div className="absolute top-3 left-3 z-10 text-[9px] font-mono text-[#888] tracking-wider uppercase">Live Feed</div>
      <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover opacity-40">
        <source src="https://assets.mixkit.co/videos/506/506-720.mp4" type="video/mp4" />
      </video>
      <div className="absolute left-0 right-0 h-px bg-[#CDFF00]/35 z-20" style={{ top: `${scanY}%` }} />
      <div className="absolute top-6 left-3 w-5 h-5 border-t border-l border-[#CDFF00]/35 z-10" />
      <div className="absolute top-6 right-3 w-5 h-5 border-t border-r border-[#CDFF00]/35 z-10" />
      <div className="absolute bottom-8 left-3 w-5 h-5 border-b border-l border-[#CDFF00]/35 z-10" />
      <div className="absolute bottom-8 right-3 w-5 h-5 border-b border-r border-[#CDFF00]/35 z-10" />
      {/* Crosshair */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none opacity-40">
        <div className="w-10 h-10 relative">
          <div className="absolute top-1/2 left-0 right-0 h-px bg-[#CDFF00]" />
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-[#CDFF00]" />
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 bg-[#0A0A0A]/90 border-t border-[#1A1A1A] px-3 py-1.5 flex items-center gap-4 z-20">
        <span className="text-[9px] font-mono text-red-400 flex items-center gap-1"><span className="w-1 h-1 bg-red-500 animate-pulse-dot" />REC</span>
        <span className="text-[9px] font-mono text-[#999]">{fmt(recTime)}</span>
        <span className="text-[9px] font-mono text-[#CDFF00] ml-auto">AI: ACTIVE</span>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   BENTO TILE — Chat Preview
   ════════════════════════════════════════════ */

const chatScript = [
  { role: "user" as const, text: "Search the north field" },
  { role: "ai" as const, text: "Copy. Grid search initiated — altitude 45m, scanning active." },
  { role: "user" as const, text: "Movement near the tree line" },
  { role: "ai" as const, text: "Confirmed — person detected, 91% match. GPS locked. Photo sent." },
];

function ChatTile() {
  const [visibleCount, setVisibleCount] = useState(0);
  const [displayLen, setDisplayLen] = useState(0);

  useEffect(() => {
    if (visibleCount >= chatScript.length) {
      const t = setTimeout(() => { setVisibleCount(0); setDisplayLen(0); }, 4000);
      return () => clearTimeout(t);
    }
    const msg = chatScript[visibleCount];
    if (msg.role === "user") {
      const t = setTimeout(() => { setDisplayLen(msg.text.length); setTimeout(() => setVisibleCount((p) => p + 1), 900); }, 1000);
      return () => clearTimeout(t);
    } else {
      setDisplayLen(0);
      const iv = setInterval(() => {
        setDisplayLen((p) => { if (p >= msg.text.length) { clearInterval(iv); setTimeout(() => setVisibleCount((c) => c + 1), 1800); return p; } return p + 2; });
      }, 22);
      return () => clearInterval(iv);
    }
  }, [visibleCount]);

  return (
    <div className="bento-tile flex flex-col">
      <div className="px-4 pt-3 pb-2 border-b border-[#1A1A1A] flex items-center gap-2">
        <span className="w-1.5 h-1.5 bg-[#22C55E] animate-pulse-dot" />
        <span className="text-[9px] font-mono text-[#888] tracking-wider uppercase">Command Center</span>
      </div>
      <div className="flex-1 p-3 space-y-2 overflow-hidden">
        {chatScript.slice(0, visibleCount + 1).map((msg, i) => {
          const isTyping = i === visibleCount;
          const text = isTyping ? msg.text.slice(0, displayLen) : msg.text;
          if (!text) return null;
          return (
            <div key={`${visibleCount}-${i}`}
              className={`p-2.5 ${msg.role === "ai" ? "border-l-2 border-l-[#CDFF00]/40 bg-[#111] mr-2" : "border-l-2 border-l-[#666] ml-2"}`}>
              <p className="text-[8px] font-mono text-[#888] tracking-wider mb-1">{msg.role === "ai" ? "SKYSEARCH" : "OPERATOR"}</p>
              <p className="text-[11px] text-[#CCC] leading-relaxed">
                {text}
                {isTyping && msg.role === "ai" && displayLen < msg.text.length && <span className="inline-block w-0.5 h-3 bg-[#CDFF00] ml-0.5 align-middle animate-pulse" />}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   BENTO TILE — Stats
   ════════════════════════════════════════════ */

function StatsTile() {
  const [objects, setObjects] = useState(847);
  const [area, setArea] = useState(3.2);
  useEffect(() => { const iv = setInterval(() => { setObjects((p) => p + Math.floor(Math.random() * 3) + 1); setArea((p) => +(p + 0.01).toFixed(2)); }, 2000); return () => clearInterval(iv); }, []);

  return (
    <div className="bento-tile flex flex-col justify-between p-4">
      <span className="text-[9px] font-mono text-[#888] tracking-wider uppercase">Mission Metrics</span>
      <div className="space-y-4">
        <div>
          <p className="text-3xl font-mono text-[#EDEDED] tracking-tight leading-none">{objects}</p>
          <p className="text-[9px] font-mono text-[#888] tracking-wider uppercase mt-1">Objects Detected</p>
        </div>
        <div>
          <p className="text-3xl font-mono text-[#CDFF00] tracking-tight leading-none crt-glow">{area}<span className="text-lg"> km&sup2;</span></p>
          <p className="text-[9px] font-mono text-[#888] tracking-wider uppercase mt-1">Area Scanned</p>
        </div>
        <div>
          <p className="text-3xl font-mono text-[#EDEDED] tracking-tight leading-none">&lt;2<span className="text-lg">s</span></p>
          <p className="text-[9px] font-mono text-[#888] tracking-wider uppercase mt-1">Response Time</p>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   BENTO TILE — Voice
   ════════════════════════════════════════════ */

const voiceCommands = ["Search the area", "Find my friend", "Return home", "Take a photo", "Scan sector B"];

function VoiceTile() {
  const [cmdIdx, setCmdIdx] = useState(0);
  const [charCount, setCharCount] = useState(0);
  useEffect(() => {
    const cmd = voiceCommands[cmdIdx];
    if (charCount < cmd.length) { const t = setTimeout(() => setCharCount((p) => p + 1), 50); return () => clearTimeout(t); }
    const t = setTimeout(() => { setCharCount(0); setCmdIdx((p) => (p + 1) % voiceCommands.length); }, 2000);
    return () => clearTimeout(t);
  }, [cmdIdx, charCount]);

  return (
    <div className="bento-tile flex flex-col items-center justify-center gap-4 text-center relative">
      <div className="absolute top-3 left-3"><span className="text-[9px] font-mono text-[#888] tracking-wider uppercase">Voice Input</span></div>
      <div className="flex items-end gap-[2px] h-8">
        {Array.from({ length: 24 }).map((_, i) => (
          <div key={i} className="w-[2px] bg-[#CDFF00] rounded-full"
            style={{ height: `${Math.max(4, 32 - Math.abs(i - 12) * 3)}px`, opacity: charCount > 0 ? 0.7 : 0.15,
              transformOrigin: "bottom", animation: charCount > 0 ? `waveBar 0.35s ease-in-out ${i * 0.03}s infinite alternate` : "none",
              transform: charCount > 0 ? undefined : "scaleY(0.2)", transition: "opacity 0.3s" }} />
        ))}
      </div>
      <p className="text-sm font-mono text-[#CCC] h-5">
        {charCount > 0
          ? <>&ldquo;{voiceCommands[cmdIdx].slice(0, charCount)}<span className="inline-block w-0.5 h-3.5 bg-[#CDFF00]/60 ml-px align-middle animate-pulse" />&rdquo;</>
          : <span className="text-[#666]">awaiting input...</span>}
      </p>
    </div>
  );
}

/* ════════════════════════════════════════════
   BENTO TILE — Drones
   ════════════════════════════════════════════ */

const droneModels = [
  { name: "Mavic 3 Pro", status: "CONNECTED" }, { name: "Mini 4 Pro", status: "READY" },
  { name: "Air 3", status: "READY" }, { name: "Avata 2", status: "READY" },
  { name: "Inspire 3", status: "READY" }, { name: "Matrice 350", status: "READY" },
];

function DronesTile() {
  return (
    <div className="bento-tile flex flex-col p-4">
      <span className="text-[9px] font-mono text-[#888] tracking-wider uppercase mb-3">Fleet Status</span>
      <div className="flex-1 space-y-2">
        {droneModels.map((m) => (
          <div key={m.name} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`w-1.5 h-1.5 ${m.status === "CONNECTED" ? "bg-[#CDFF00] animate-pulse-dot" : "bg-[#333]"}`} />
              <span className="text-[11px] font-mono text-[#CCC]">{m.name}</span>
            </div>
            <span className={`text-[8px] font-mono tracking-wider ${m.status === "CONNECTED" ? "text-[#CDFF00]" : "text-[#777]"}`}>{m.status}</span>
          </div>
        ))}
      </div>
      <div className="pt-2 border-t border-[#1A1A1A] mt-2"><span className="text-[10px] font-mono text-[#CDFF00]">50+ DJI drones compatible</span></div>
    </div>
  );
}

/* ════════════════════════════════════════════
   BENTO TILE — Map
   ════════════════════════════════════════════ */

function MapTile() {
  const [dronePos, setDronePos] = useState({ x: 150, y: 90 });
  const [path, setPath] = useState<{ x: number; y: number }[]>([{ x: 150, y: 90 }]);
  useEffect(() => {
    let t = 0;
    const iv = setInterval(() => { t += 0.012; const x = 150 + Math.sin(t) * 80; const y = 90 + Math.sin(t * 1.3) * 50;
      setDronePos({ x, y }); setPath((prev) => { const next = [...prev, { x, y }]; return next.length > 60 ? next.slice(next.length - 60) : next; });
    }, 80);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="bento-tile">
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
        <span className="text-[9px] font-mono text-[#888] tracking-wider uppercase">GPS Tracker</span>
        <span className="text-[8px] font-mono text-[#CDFF00] animate-pulse-dot">LIVE</span>
      </div>
      <svg viewBox="0 0 300 180" className="w-full h-full" style={{ display: "block" }}>
        <rect width="300" height="180" fill="#050505" />
        {[0,1,2,3,4].map((i) => <line key={`v${i}`} x1={i*75} y1="0" x2={i*75} y2="180" stroke="#222" strokeWidth="1" />)}
        {[0,1,2,3].map((i) => <line key={`h${i}`} x1="0" y1={i*60} x2="300" y2={i*60} stroke="#222" strokeWidth="1" />)}
        {([["A",37,20],["B",187,20],["C",37,110],["D",187,110]] as const).map(([l,x,y]) => <text key={l} x={x} y={y} fill="#333" fontSize="22" fontWeight="bold" fontFamily="monospace">{l}</text>)}
        <circle cx="150" cy="90" r="60" fill="none" stroke="#333" strokeWidth="1" strokeDasharray="4 3" />
        <circle cx="150" cy="90" r="3" fill="none" stroke="#22C55E" strokeWidth="1" />
        {path.length > 1 && <polyline points={path.map((p) => `${p.x},${p.y}`).join(" ")} fill="none" stroke="#CDFF00" strokeWidth="1" strokeOpacity="0.45" strokeLinecap="round" />}
        <circle cx={dronePos.x} cy={dronePos.y} r="12" fill="url(#droneGlow)" />
        <circle cx={dronePos.x} cy={dronePos.y} r="3" fill="#CDFF00" />
        <circle cx={dronePos.x} cy={dronePos.y} r="1.5" fill="#0A0A0A" />
        <defs><radialGradient id="droneGlow"><stop offset="0%" stopColor="#CDFF00" stopOpacity="0.25" /><stop offset="100%" stopColor="#CDFF00" stopOpacity="0" /></radialGradient></defs>
      </svg>
    </div>
  );
}

/* ════════════════════════════════════════════
   DETECTION DEMO — Fire Scan HUD
   ════════════════════════════════════════════ */

/* Fire detection keyframes from box editor (full coverage 0–19.92s) */
const fireKeyframes = [
  {t:0,x:34.8,y:46.7,w:11.9,h:28.6},
  {t:0.62,x:34.8,y:46.7,w:11.9,h:28.6},{t:0.92,x:35.3,y:48.5,w:11.9,h:28.6},{t:1.22,x:35.3,y:50,w:11.9,h:28.6},
  {t:1.51,x:35.5,y:50.7,w:11.9,h:28.6},{t:1.81,x:35.6,y:51.5,w:11.9,h:28.6},{t:2.06,x:35.9,y:52.5,w:11.9,h:28.6},
  {t:2.37,x:36.2,y:53.4,w:11.9,h:28.6},{t:2.71,x:36.5,y:54.1,w:11.9,h:28.6},{t:3.07,x:36.8,y:54.3,w:11.9,h:28.6},
  {t:3.41,x:37.5,y:54.4,w:11.9,h:28.6},{t:3.81,x:37.9,y:54.6,w:11.9,h:28.6},{t:4.12,x:38.1,y:54.7,w:11.9,h:28.6},
  {t:4.46,x:39.1,y:55.9,w:11.9,h:28.6},{t:4.81,x:39.5,y:56.6,w:11.9,h:28.6},{t:5.14,x:40,y:57.5,w:11.9,h:28.6},
  {t:5.49,x:40.6,y:58.4,w:11.9,h:28.6},{t:5.84,x:41.3,y:59.2,w:11.9,h:28.6},{t:6.22,x:41.7,y:59.8,w:11.9,h:28.6},
  {t:6.61,x:42,y:60.3,w:11.9,h:28.6},{t:6.9,x:42.6,y:61.3,w:11.9,h:28.6},{t:7.22,x:43,y:61.9,w:11.9,h:28.6},
  {t:7.58,x:43.3,y:62.6,w:11.9,h:28.6},{t:7.95,x:43.5,y:63.2,w:11.9,h:28.6},{t:8.31,x:43.9,y:64,w:11.9,h:28.6},
  {t:8.62,x:44.1,y:64.8,w:11.9,h:28.6},{t:8.88,x:44.7,y:66,w:11.9,h:28.6},{t:9.22,x:45.2,y:67,w:11.9,h:28.6},
  {t:9.53,x:46,y:68.2,w:11.9,h:28.6},{t:9.88,x:46.4,y:68.7,w:11.9,h:28.6},{t:10.22,x:46.6,y:69,w:11.9,h:28.6},
  {t:10.55,x:47,y:69.9,w:11.9,h:28.6},{t:10.72,x:47.2,y:70.3,w:11.9,h:28.5},{t:10.93,x:47.4,y:70.5,w:11.8,h:28.3},
  {t:11.18,x:47.6,y:71.1,w:11.7,h:28},{t:11.51,x:47.6,y:71.5,w:11.6,h:27.6},{t:11.78,x:47.7,y:73.6,w:10.7,h:25.6},
  {t:12.14,x:48.1,y:73.6,w:10.7,h:25.5},{t:12.47,x:48.1,y:74.1,w:10.7,h:25.4},{t:12.81,x:48.4,y:74,w:10.7,h:25.3},
  {t:13.14,x:48.7,y:73.4,w:10.7,h:25.2},{t:13.52,x:48.8,y:73.1,w:10.7,h:25},{t:13.81,x:49.8,y:73.5,w:10.7,h:25},
  {t:14.18,x:50.1,y:73.2,w:10.7,h:25},{t:14.52,x:50.8,y:72.8,w:10.7,h:25},{t:14.93,x:51,y:72.4,w:10.7,h:25},
  {t:15.31,x:51.6,y:72,w:10.7,h:25},{t:15.71,x:52,y:71.6,w:10.7,h:25},{t:15.93,x:51.8,y:72.8,w:10,h:23.4},
  {t:16.34,x:52.3,y:72.8,w:10,h:23.4},{t:16.73,x:53,y:72.2,w:10,h:23.4},{t:17.11,x:53.8,y:72.1,w:10,h:23.4},
  {t:17.52,x:53.9,y:72.1,w:10,h:23.4},{t:17.86,x:54.1,y:71.3,w:10,h:23.4},{t:18.2,x:54.2,y:70.7,w:10,h:23.4},
  {t:18.6,x:54.1,y:70.4,w:10,h:23.4},{t:19.12,x:54,y:70.3,w:10,h:23.4},{t:19.52,x:54.7,y:70.2,w:10,h:23.4},
  {t:19.86,x:54.8,y:69.7,w:10,h:23.4},{t:19.92,x:54.8,y:69.7,w:10,h:23.4},
];

function lerpKF(time: number) {
  const kfs = fireKeyframes;
  if (time <= kfs[0].t) return kfs[0];
  if (time >= kfs[kfs.length - 1].t) return kfs[kfs.length - 1];
  for (let i = 0; i < kfs.length - 1; i++) {
    if (time >= kfs[i].t && time <= kfs[i + 1].t) {
      const p = (time - kfs[i].t) / (kfs[i + 1].t - kfs[i].t);
      return {
        t: time,
        x: kfs[i].x + (kfs[i + 1].x - kfs[i].x) * p,
        y: kfs[i].y + (kfs[i + 1].y - kfs[i].y) * p,
        w: kfs[i].w + (kfs[i + 1].w - kfs[i].w) * p,
        h: kfs[i].h + (kfs[i + 1].h - kfs[i].h) * p,
      };
    }
  }
  return kfs[kfs.length - 1];
}

/* Pseudo-random confidence that oscillates in high 80s–90s */
function getConfidence(time: number) {
  const base = 89;
  const wave = Math.sin(time * 1.7) * 3 + Math.sin(time * 3.1) * 2 + Math.sin(time * 0.5) * 1.5;
  return Math.round(Math.min(96, Math.max(85, base + wave)));
}

type ScanPhase = "idle" | "scanning" | "analyzing" | "detected" | "alert";

function DetectionDemo() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [started, setStarted] = useState(false);
  const [sequenceKey, setSequenceKey] = useState(0);
  const [phase, setPhase] = useState<ScanPhase>("idle");
  const [scanY, setScanY] = useState(0);
  const [typeText, setTypeText] = useState("");
  const [showBox, setShowBox] = useState(false);
  const [alertFlash, setAlertFlash] = useState(false);
  const [hudTime, setHudTime] = useState(0);
  const [threatLevel, setThreatLevel] = useState("LOW");
  const [tempReading, setTempReading] = useState(22);
  const [infoLines, setInfoLines] = useState<string[]>([]);
  const [boxPos, setBoxPos] = useState({ x: 34.8, y: 46.7, w: 11.9, h: 28.6 });
  const [confidence, setConfidence] = useState(89);
  const previousVideoTimeRef = useRef(0);
  const typeIntervalRef = useRef<number | null>(null);

  // Start on scroll
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started) setStarted(true);
    }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [started]);

  // HUD clock
  useEffect(() => {
    if (!started) return;
    const iv = setInterval(() => setHudTime(p => p + 1), 1000);
    return () => clearInterval(iv);
  }, [started]);

  useEffect(() => {
    if (!started) return;
    const video = videoRef.current;
    if (!video) return;

    previousVideoTimeRef.current = 0;
    const resetVideo = () => {
      video.currentTime = 0;
      const playPromise = video.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => undefined);
      }
    };

    if (video.readyState >= 1) {
      resetVideo();
      return;
    }

    video.addEventListener("loadedmetadata", resetVideo, { once: true });
    return () => video.removeEventListener("loadedmetadata", resetVideo);
  }, [started]);

  const clearTypeInterval = useCallback(() => {
    if (typeIntervalRef.current !== null) {
      window.clearInterval(typeIntervalRef.current);
      typeIntervalRef.current = null;
    }
  }, []);

  // Sync detection box position to video time (always running)
  const showBoxRef = useRef(false);
  showBoxRef.current = showBox;

  useEffect(() => {
    if (!started) return;
    let raf: number;
    const tick = () => {
      const v = videoRef.current;
      if (v) {
        const t = v.currentTime;
        if (previousVideoTimeRef.current - t > 1) {
          setShowBox(false);
          setAlertFlash(false);
          setPhase("idle");
          setInfoLines([]);
          setTypeText("");
          clearTypeInterval();
          setSequenceKey((key) => key + 1);
        }
        previousVideoTimeRef.current = t;

        if (showBoxRef.current) {
          const kf = lerpKF(t);
          setBoxPos({ x: kf.x, y: kf.y, w: kf.w, h: kf.h });
          setConfidence(getConfidence(t));
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [started, clearTypeInterval]);

  // Typewriter helper
  const typeOut = useCallback((text: string, speed: number = 30): Promise<void> => {
    return new Promise(resolve => {
      clearTypeInterval();
      let i = 0;
      setTypeText("");
      typeIntervalRef.current = window.setInterval(() => {
        i++;
        setTypeText(text.slice(0, i));
        if (i >= text.length) {
          clearTypeInterval();
          resolve();
        }
      }, speed);
    });
  }, [clearTypeInterval]);

  // Main sequence
  useEffect(() => {
    if (!started) return;
    let cancelled = false;
    let alertTimeout: ReturnType<typeof setTimeout> | null = null;

    const run = async () => {
      // Reset everything
      setPhase("idle");
      setScanY(0);
      setShowBox(false);
      setAlertFlash(false);
      setThreatLevel("LOW");
      setTempReading(22);
      setInfoLines([]);
      setTypeText("");
      clearTypeInterval();

      await wait(1200);
      if (cancelled) return;

      // Phase 1: Scan
      setPhase("scanning");
      await typeOut("INITIATING SCAN...", 35);
      if (cancelled) return;
      setScanY(0);

      await new Promise<void>(resolve => {
        let y = 0;
        const iv = setInterval(() => {
          if (cancelled) {
            clearInterval(iv);
            resolve();
            return;
          }
          y += 1.2;
          setScanY(y);
          if (y >= 100) { clearInterval(iv); resolve(); }
        }, 25);
      });

      if (cancelled) return;

      // Phase 2: Analyzing
      setPhase("analyzing");
      await typeOut("ANOMALY DETECTED — ANALYZING...", 25);
      setTempReading(340);
      if (cancelled) return;
      await wait(1000);

      if (cancelled) return;

      // Phase 3: Detection — box appears and tracks fire
      setPhase("detected");
      setShowBox(true);
      setAlertFlash(true);
      alertTimeout = setTimeout(() => setAlertFlash(false), 1500);
      setThreatLevel("HIGH");
      await typeOut("FIRE DETECTED — TRACKING TARGET", 20);

      await wait(1200);
      if (cancelled) return;

      // Info lines
      const lines = [
        "CLASS: WILDFIRE — ACTIVE BURN",
        "EST. AREA: ~18m² — SPREADING",
        "WIND: 14 km/h NW — HIGH RISK",
        "ACTION: EMERGENCY SERVICES NOTIFIED",
      ];
      for (const line of lines) {
        if (cancelled) return;
        setInfoLines(prev => [...prev, line]);
        await wait(700);
      }

      // Phase 4: Tracking
      setPhase("alert");
      await wait(600);
      if (cancelled) return;
      await typeOut("MAINTAINING VISUAL — AI TRACKING ACTIVE", 25);

      // Hold tracking then restart the whole sequence
      await wait(6000);
      if (cancelled) return;

      // Reset for next loop
      setShowBox(false);
      setPhase("idle");
      setAlertFlash(false);
      setThreatLevel("LOW");
      setTempReading(22);
      setInfoLines([]);
      setTypeText("");

      // Restart video from beginning
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
      }

      await wait(1500);
      if (!cancelled) run();
    };

    run();
    return () => {
      cancelled = true;
      if (alertTimeout) clearTimeout(alertTimeout);
      clearTypeInterval();
    };
  }, [started, typeOut, clearTypeInterval, sequenceKey]);

  const fmtTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const isActive = phase !== "idle";
  const isDanger = phase === "detected" || phase === "alert";

  return (
    <section ref={sectionRef} className="relative max-w-6xl mx-auto px-4 lg:px-12 py-16 lg:py-24">
      <FadeIn>
        <div className="text-center mb-12">
          <p className="text-[10px] font-mono tracking-[0.4em] uppercase text-[#CDFF00]/70 mb-4">Live Detection</p>
          <h2 className="text-3xl sm:text-4xl font-semibold text-white tracking-tight">
            See what the AI sees.
          </h2>
        </div>
      </FadeIn>

      <FadeIn delay={200}>
        <div className={`relative w-full aspect-video bg-[#050505] border overflow-hidden transition-all duration-500 ${alertFlash ? "border-red-500/60 shadow-[0_0_60px_rgba(239,68,68,0.15)]" : isDanger ? "border-red-500/30" : "border-[#1A1A1A]"}`}>
          {/* Video */}
          <video ref={videoRef} autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover opacity-70">
            <source src="/forest-fire.mp4" type="video/mp4" />
          </video>

          {/* Darken overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0A]/40 via-transparent to-[#0A0A0A]/60 z-[1]" />

          {/* Scan line */}
          {phase === "scanning" && (
            <div className="absolute left-0 right-0 z-30 pointer-events-none" style={{ top: `${scanY}%` }}>
              <div className="h-px bg-[#CDFF00] shadow-[0_0_12px_rgba(205,255,0,0.6)]" />
              <div className="h-8 bg-gradient-to-b from-[#CDFF00]/10 to-transparent" />
            </div>
          )}

          {/* Corner brackets */}
          <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-[#CDFF00]/50 z-10" />
          <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-[#CDFF00]/50 z-10" />
          <div className="absolute bottom-10 left-3 w-6 h-6 border-b-2 border-l-2 border-[#CDFF00]/50 z-10" />
          <div className="absolute bottom-10 right-3 w-6 h-6 border-b-2 border-r-2 border-[#CDFF00]/50 z-10" />

          {/* Center crosshair */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none">
            <div className="w-16 h-16 relative opacity-30">
              <div className="absolute top-1/2 left-0 w-[35%] h-px bg-[#CDFF00]" />
              <div className="absolute top-1/2 right-0 w-[35%] h-px bg-[#CDFF00]" />
              <div className="absolute left-1/2 top-0 h-[35%] w-px bg-[#CDFF00]" />
              <div className="absolute left-1/2 bottom-0 h-[35%] w-px bg-[#CDFF00]" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 border border-[#CDFF00]/50 rounded-full" />
            </div>
          </div>

          {/* ─── HUD: Top bar ─── */}
          <div className="absolute top-3 left-10 right-10 z-20 flex items-start justify-between">
            <div className="flex items-center gap-2">
              <span className={`w-1.5 h-1.5 ${isDanger ? "bg-red-500" : "bg-[#22C55E]"} animate-pulse-dot`} />
              <span className="text-[10px] font-mono text-white/70 tracking-widest">
                SENTINEL OS — {isDanger ? "ALERT" : isActive ? "SCANNING" : "STANDBY"}
              </span>
            </div>
            <div className="text-right space-y-0.5">
              <div className="text-[10px] font-mono text-white/60 tracking-wider">ALT 52.1m</div>
              <div className="text-[10px] font-mono text-white/60 tracking-wider">40.0150°N 105.2705°W</div>
            </div>
          </div>

          {/* ─── HUD: Left side ─── */}
          <div className="absolute top-14 left-4 z-20 space-y-1.5">
            <div className="text-[9px] font-mono text-white/50 tracking-wider">MODE: SURVEILLANCE</div>
            <div className="text-[9px] font-mono text-white/50 tracking-wider">FPS: 30 | RES: 1080p</div>
            <div className={`text-[9px] font-mono tracking-wider ${isDanger ? "text-red-400" : "text-white/50"}`}>
              TEMP: {tempReading}°C {tempReading > 100 ? "▲▲▲" : ""}
            </div>
            <div className={`text-[9px] font-mono tracking-wider mt-2 px-1.5 py-0.5 inline-block ${
              threatLevel === "HIGH" ? "text-red-400 bg-red-500/15 border border-red-500/30" : "text-[#CDFF00]/70 bg-[#CDFF00]/5 border border-[#CDFF00]/20"
            }`}>
              THREAT: {threatLevel}
            </div>
          </div>

          {/* ─── HUD: Right side — info lines ─── */}
          {infoLines.length > 0 && (
            <div className="absolute top-14 right-4 z-20 space-y-1 max-w-[240px] text-right">
              {infoLines.map((line, i) => (
                <div key={i} className={`text-[9px] font-mono tracking-wider ${line.includes("EMERGENCY") ? "text-red-400" : "text-white/60"}`}
                  style={{ animation: "fade-in-up 0.3s ease-out forwards" }}>
                  {line}
                </div>
              ))}
            </div>
          )}

          {/* ─── Detection box — synced to video via keyframes ─── */}
          {showBox && (
            <div className="absolute z-20 transition-none"
              style={{ top: `${boxPos.y}%`, left: `${boxPos.x}%`, width: `${boxPos.w}%`, height: `${boxPos.h}%` }}>
              <div className="w-full h-full border-2 border-red-500/70 animate-detection-appear"
                style={{ boxShadow: "0 0 20px rgba(239,68,68,0.2), inset 0 0 20px rgba(239,68,68,0.05)" }}>
                <div className="absolute -top-px -left-px w-3 h-3 border-t-2 border-l-2 border-red-400" />
                <div className="absolute -top-px -right-px w-3 h-3 border-t-2 border-r-2 border-red-400" />
                <div className="absolute -bottom-px -left-px w-3 h-3 border-b-2 border-l-2 border-red-400" />
                <div className="absolute -bottom-px -right-px w-3 h-3 border-b-2 border-r-2 border-red-400" />
              </div>
              <div className="absolute -top-7 left-0 flex items-center gap-2">
                <span className="bg-red-500/90 text-white text-[10px] font-mono font-bold px-2 py-0.5 tracking-wider">
                  FIRE {confidence}%
                </span>
                <span className="text-[9px] font-mono text-red-400 animate-pulse">● TRACKING</span>
              </div>
            </div>
          )}

          {/* ─── Pulse ring on detection ─── */}
          {alertFlash && (
            <>
              <div className="absolute z-15 w-32 h-32 rounded-full border border-red-500/40"
                style={{ top: `${boxPos.y + boxPos.h / 2}%`, left: `${boxPos.x + boxPos.w / 2}%`, transform: "translate(-50%,-50%)", animation: "pulse-ring 1.5s ease-out forwards" }} />
              <div className="absolute z-15 w-32 h-32 rounded-full border border-red-500/25"
                style={{ top: `${boxPos.y + boxPos.h / 2}%`, left: `${boxPos.x + boxPos.w / 2}%`, transform: "translate(-50%,-50%)", animation: "pulse-ring 1.5s ease-out 0.3s forwards" }} />
            </>
          )}

          {/* ─── Bottom bar ─── */}
          <div className="absolute bottom-0 left-0 right-0 bg-[#0A0A0A]/85 backdrop-blur-sm border-t border-[#1A1A1A] px-4 py-2 flex items-center justify-between z-20">
            <div className="flex items-center gap-4">
              <span className="text-[9px] font-mono text-red-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-red-500 animate-pulse-dot rounded-full" />REC
              </span>
              <span className="text-[10px] font-mono text-white/60">{fmtTime(hudTime)}</span>
              <span className="text-[9px] font-mono text-white/40">|</span>
              <span className="text-[10px] font-mono text-white/60">AI + VISUAL</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-mono text-white/50">BAT 78%</span>
              <span className="text-[10px] font-mono text-white/50">SIG ████░ </span>
              <span className={`text-[10px] font-mono font-bold tracking-wider ${isDanger ? "text-red-400" : "text-[#CDFF00]"}`}>
                AI: {isDanger ? "ALERT" : "ACTIVE"}
              </span>
            </div>
          </div>

          {/* ─── Status text ─── */}
          {typeText && (
            <div className="absolute bottom-12 left-4 z-20">
              <div className={`text-[11px] font-mono tracking-wider px-2 py-1 ${
                isDanger ? "text-red-400 bg-red-500/10 border border-red-500/20" : "text-[#CDFF00] bg-[#CDFF00]/5 border border-[#CDFF00]/20"
              }`}>
                {typeText}
                <span className={`inline-block w-0.5 h-3 ml-1 align-middle animate-pulse ${isDanger ? "bg-red-400" : "bg-[#CDFF00]"}`} />
              </div>
            </div>
          )}

          {/* Grain */}
          <div className="grain absolute inset-0 z-[5] pointer-events-none" />
        </div>
      </FadeIn>
    </section>
  );
}

function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/* ════════════════════════════════════════════
   TELEMETRY TICKER
   ════════════════════════════════════════════ */

function TelemetryTicker() {
  const items = ["ALT 45.2m","SPD 12.4 km/h","BAT 82%","GPS 48.85°N 2.35°E","SIGNAL STRONG","TEMP 32°C","WIND 8 km/h NW","MODE AUTONOMOUS","AI ACTIVE","OBJECTS 847","AREA 3.2 km²","FLIGHT 00:14:32"];
  return (
    <div className="border-y border-[#1A1A1A] py-3 overflow-hidden">
      <div className="flex animate-ticker whitespace-nowrap">
        {[...items, ...items].map((item, i) => (
          <span key={i} className="mx-8 text-[10px] font-mono tracking-[0.15em] text-[#777]">
            <span className="text-[#CDFF00]/60 mr-2">//</span>{item}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   HOW IT WORKS — Pipeline
   ════════════════════════════════════════════ */

const pipelineSteps = [
  { num: "01", label: "SPEAK", title: "Give a command", desc: "Use natural language — voice or text. Say \"search the north field for a missing hiker\" and the AI parses your intent." },
  { num: "02", label: "THINK", title: "AI plans the mission", desc: "The LLM decomposes your command into flight parameters, search patterns, altitude, and detection targets." },
  { num: "03", label: "FLY", title: "Drone executes", desc: "Autonomous takeoff, navigation, and obstacle avoidance. Grid search patterns with battery-aware routing." },
  { num: "04", label: "FIND", title: "Instant alert", desc: "Real-time object detection at 30fps. When a match is found — photo, GPS, and confidence score delivered in under 2 seconds." },
];

/* ════════════════════════════════════════════
   USE CASES
   ════════════════════════════════════════════ */

const useCases = [
  { title: "Search & Rescue", desc: "Find missing people in wilderness, disaster zones, or urban areas. AI-powered detection + facial recognition across any terrain.", icon: "🔍", stat: "94% detection rate" },
  { title: "Sports Filming", desc: "Autonomous broadcast-quality footage. AI tracks players, ball, and action across 6+ sport types without a pilot.", icon: "🎬", stat: "4K 60fps" },
  { title: "Surveillance", desc: "Persistent area monitoring with real-time alerts. Detect vehicles, people, and anomalies across multiple sectors.", icon: "📡", stat: "24/7 autonomous" },
];

/* ════════════════════════════════════════════
   PAGE
   ════════════════════════════════════════════ */

export default function Home() {
  const [booted, setBooted] = useState(false);
  const [heroVisible, setHeroVisible] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const gridRef = useRef<HTMLDivElement>(null);
  const [gridVisible, setGridVisible] = useState(false);

  const handleBootComplete = useCallback(() => { setBooted(true); setTimeout(() => setHeroVisible(true), 100); }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => setMousePos({ x: (e.clientX / window.innerWidth - 0.5) * 2, y: (e.clientY / window.innerHeight - 0.5) * 2 });
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) setGridVisible(true); }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div>
      {!booted && <BootSequence onComplete={handleBootComplete} />}
      {booted && <><DataStream side="left" /><DataStream side="right" /></>}

      {/* ═══ HERO ═══ */}
      <section className="relative min-h-screen flex flex-col justify-center overflow-hidden">
        <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: heroVisible ? 0.25 : 0, transition: "opacity 1.5s ease-out" }}
          poster="https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1920&q=80">
          <source src="https://assets.mixkit.co/videos/44690/44690-720.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0A]/50 via-[#0A0A0A]/20 to-[#0A0A0A] z-[1]" />
        <div className="grain absolute inset-0 z-[2] pointer-events-none" />
        <div className="absolute inset-0 z-[3] pointer-events-none overflow-hidden">
          <div className="absolute left-0 right-0 h-px bg-[#CDFF00]/20 animate-scan" style={{ opacity: heroVisible ? 1 : 0, transition: "opacity 1s" }} />
        </div>

        {/* Corner brackets */}
        {heroVisible && <>
          <div className="absolute top-20 left-6 lg:left-12 w-12 h-12 border-t border-l border-[#CDFF00]/35 z-[4]" style={{ animation: "border-trace 0.8s ease-out 0.5s both" }} />
          <div className="absolute top-20 right-6 lg:right-12 w-12 h-12 border-t border-r border-[#CDFF00]/35 z-[4]" style={{ animation: "border-trace 0.8s ease-out 0.7s both" }} />
          <div className="absolute bottom-20 left-6 lg:left-12 w-12 h-12 border-b border-l border-[#CDFF00]/35 z-[4]" style={{ animation: "border-trace 0.8s ease-out 0.9s both" }} />
          <div className="absolute bottom-20 right-6 lg:right-12 w-12 h-12 border-b border-r border-[#CDFF00]/35 z-[4]" style={{ animation: "border-trace 0.8s ease-out 1.1s both" }} />
        </>}

        {/* HUD edges */}
        {heroVisible && <>
          <div className="absolute top-[76px] left-6 lg:left-14 z-10 flex items-center gap-2" style={{ animation: "fade-in-up 0.6s ease-out 1.2s both" }}>
            <span className="w-1.5 h-1.5 bg-[#22C55E] animate-pulse-dot" />
            <span className="text-[9px] font-mono text-white/50 tracking-widest">SENTINEL OS — ONLINE</span>
          </div>
          <div className="absolute top-[76px] right-6 lg:right-14 z-10 text-right" style={{ animation: "fade-in-up 0.6s ease-out 1.4s both" }}>
            <div className="text-[9px] font-mono text-white/50 tracking-widest space-y-0.5"><div>ALT 45.2m</div><div>SPD 12 km/h</div></div>
          </div>
          <div className="absolute bottom-[76px] left-6 lg:left-14 z-10" style={{ animation: "fade-in-up 0.6s ease-out 1.6s both" }}>
            <div className="text-[9px] font-mono text-white/50 tracking-widest space-y-0.5"><div>48.85&deg;N 2.35&deg;E</div><div>MODE: AUTONOMOUS</div></div>
          </div>
          <div className="absolute bottom-[76px] right-6 lg:right-14 z-10 text-right" style={{ animation: "fade-in-up 0.6s ease-out 1.8s both" }}>
            <span className="text-[9px] font-mono text-white/50 tracking-widest"><LiveClock /></span>
          </div>
        </>}

        {/* Center crosshair */}
        {heroVisible && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[5] pointer-events-none" style={{ animation: "scale-in 0.8s ease-out 0.8s both" }}>
            <div className="w-20 h-20 relative">
              <div className="absolute top-1/2 left-0 w-[30%] h-px bg-[#CDFF00]/30" />
              <div className="absolute top-1/2 right-0 w-[30%] h-px bg-[#CDFF00]/30" />
              <div className="absolute left-1/2 top-0 h-[30%] w-px bg-[#CDFF00]/30" />
              <div className="absolute left-1/2 bottom-0 h-[30%] w-px bg-[#CDFF00]/30" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 border border-[#CDFF00]/40 rounded-full" />
            </div>
          </div>
        )}

        {/* Main content */}
        <div className="relative z-10 px-6 lg:px-20 xl:px-32"
          style={{ transform: `translate(${mousePos.x * 4}px, ${mousePos.y * 4}px)`, transition: "transform 0.4s ease-out" }}>
          {heroVisible && (
            <div className="max-w-5xl">
              <div className="text-[10px] font-mono tracking-[0.5em] uppercase text-[#CDFF00]/80 mb-6" style={{ animation: "fade-in-up 0.6s ease-out 0.3s both" }}>
                Autonomous Drone Intelligence
              </div>
              <h1 className="text-[clamp(3rem,8vw,7rem)] font-semibold tracking-[-0.03em] leading-[0.9] text-white" style={{ animation: "clip-reveal-left 1s cubic-bezier(0.16, 1, 0.3, 1) 0.5s both" }}>
                <GlitchText text="Sentinel" intervalMs={4000} scrambleDurationMs={900} />
                <br /><GlitchText text="OS" className="text-[#CDFF00] crt-glow" style={{ animation: "glow-in 1.2s ease-out 1.5s both" }} intervalMs={4000} scrambleDurationMs={900} />
              </h1>
              <div className="mt-8 h-px bg-gradient-to-r from-[#CDFF00]/50 via-[#CDFF00]/25 to-transparent max-w-md" style={{ animation: "line-grow 0.8s ease-out 1.8s both", transformOrigin: "left" }} />
              <p className="mt-6 text-base sm:text-lg text-[#BBB] max-w-lg leading-relaxed" style={{ animation: "fade-in-up 0.8s ease-out 2s both" }}>
                Speak a command. The AI flies, scans, detects, and reports back. Search&nbsp;&amp;&nbsp;rescue, surveillance, sports — one voice interface for any DJI drone.
              </p>
              <div className="mt-10 flex items-center gap-6" style={{ animation: "fade-in-up 0.8s ease-out 2.3s both" }}>
                <Link href="/control"
                  className="group relative inline-flex items-center gap-3 px-8 py-4 bg-[#CDFF00] text-[#0A0A0A] text-xs font-bold tracking-[0.15em] uppercase hover:bg-[#d8ff33] transition-all duration-300">
                  <span className="w-1.5 h-1.5 bg-[#0A0A0A] group-hover:scale-150 transition-transform" />
                  Launch Control Panel
                  <div className="absolute inset-0 bg-[#CDFF00] opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500 -z-10" />
                </Link>
              </div>
            </div>
          )}
        </div>

        {heroVisible && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2" style={{ animation: "fade-in-up 0.6s ease-out 2.8s both" }}>
            <span className="text-[8px] font-mono text-[#777] tracking-[0.3em] uppercase">Scroll</span>
            <div className="w-px h-6 bg-gradient-to-b from-[#777] to-transparent" />
          </div>
        )}
      </section>

      {/* ═══ TICKER ═══ */}
      <TelemetryTicker />

      {/* ═══ DETECTION DEMO ═══ */}
      <DetectionDemo />

      {/* ═══ HOW IT WORKS ═══ */}
      <section className="max-w-6xl mx-auto px-6 lg:px-12 py-24 lg:py-32">
        <FadeIn>
          <div className="text-center mb-16">
            <p className="text-[10px] font-mono tracking-[0.4em] uppercase text-[#CDFF00]/70 mb-4">How It Works</p>
            <h2 className="text-3xl sm:text-4xl font-semibold text-white tracking-tight">
              From voice to visual in seconds.
            </h2>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[1px] bg-[#1A1A1A]">
          {pipelineSteps.map((step, i) => (
            <FadeIn key={step.num} delay={i * 100} duration={500}>
              <div className="bg-[#0A0A0A] p-6 lg:p-8 h-full group hover:bg-[#0F0F0F] transition-colors duration-500 relative overflow-hidden">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-4xl font-mono font-light text-[#333] group-hover:text-[#CDFF00]/15 transition-colors duration-500">{step.num}</span>
                  <span className="text-[10px] font-mono text-[#CDFF00] tracking-[0.2em]">{step.label}</span>
                </div>
                <h3 className="text-base font-semibold text-[#EDEDED] mb-3">{step.title}</h3>
                <p className="text-sm text-[#AAA] leading-relaxed">{step.desc}</p>
                <div className="absolute bottom-0 left-0 w-0 group-hover:w-full h-px bg-[#CDFF00]/30 transition-all duration-700" />
              </div>
            </FadeIn>
          ))}
        </div>

        {/* Pipeline arrow strip */}
        <div className="hidden lg:flex items-center justify-center gap-0 mt-4">
          {["VOICE INPUT", "LLM PROCESSING", "FLIGHT CONTROL", "DETECTION OUTPUT"].map((label, i) => (
            <div key={label} className="flex items-center">
              <span className="text-[8px] font-mono text-[#777] tracking-wider">{label}</span>
              {i < 3 && (
                <svg className="w-8 h-3 text-[#555] mx-2" viewBox="0 0 24 8" fill="none" stroke="currentColor" strokeWidth="1">
                  <path d="M0 4h20M16 1l4 3-4 3" />
                </svg>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ═══ TRY IT — Interactive Demo ═══ */}
      <section className="py-24 lg:py-32 border-y border-[#1A1A1A] relative">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0A] via-[#0F0F0F] to-[#0A0A0A]" />
        <div className="relative z-10 max-w-6xl mx-auto px-6 lg:px-12">
          <FadeIn>
            <div className="text-center mb-12">
              <p className="text-[10px] font-mono tracking-[0.4em] uppercase text-[#CDFF00]/70 mb-4">Try It Now</p>
              <h2 className="text-3xl sm:text-4xl font-semibold text-white tracking-tight mb-3">
                Talk to the drone.
              </h2>
              <p className="text-base text-[#AAA] max-w-md mx-auto">
                Type any command below and watch the AI respond. This is exactly how the control panel works.
              </p>
            </div>
          </FadeIn>
          <FadeIn delay={200}>
            <InteractiveDemo />
          </FadeIn>
        </div>
      </section>

      {/* ═══ USE CASES ═══ */}
      <section className="max-w-6xl mx-auto px-6 lg:px-12 py-24 lg:py-32">
        <FadeIn>
          <div className="text-center mb-16">
            <p className="text-[10px] font-mono tracking-[0.4em] uppercase text-[#CDFF00]/70 mb-4">Use Cases</p>
            <h2 className="text-3xl sm:text-4xl font-semibold text-white tracking-tight">
              One platform, infinite missions.
            </h2>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-[1px] bg-[#1A1A1A]">
          {useCases.map((uc, i) => (
            <FadeIn key={uc.title} delay={i * 100} duration={500}>
              <div className="bg-[#0A0A0A] p-8 lg:p-10 h-full group hover:bg-[#0F0F0F] transition-colors duration-500 relative overflow-hidden">
                <span className="text-3xl mb-4 block">{uc.icon}</span>
                <h3 className="text-lg font-semibold text-[#EDEDED] mb-3 group-hover:text-white transition-colors">{uc.title}</h3>
                <p className="text-sm text-[#AAA] leading-relaxed mb-4">{uc.desc}</p>
                <div className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-[#CDFF00]" />
                  <span className="text-[10px] font-mono text-[#CDFF00] tracking-wider">{uc.stat}</span>
                </div>
                <div className="absolute bottom-0 left-0 w-0 group-hover:w-full h-px bg-[#CDFF00]/30 transition-all duration-700" />
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ═══ BENTO GRID ═══ */}
      <section className="max-w-6xl mx-auto px-4 lg:px-12 py-12 lg:py-20" ref={gridRef}>
        <div className="flex items-center gap-4 mb-12">
          <div className="h-px flex-1 bg-gradient-to-r from-[#1A1A1A] to-transparent" />
          <span className="text-[10px] font-mono tracking-[0.4em] uppercase text-[#777]">Live Systems</span>
          <div className="h-px flex-1 bg-gradient-to-l from-[#1A1A1A] to-transparent" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[1px] bg-[#1A1A1A] auto-rows-[220px]"
          style={{ opacity: gridVisible ? 1 : 0, transform: gridVisible ? "translateY(0)" : "translateY(30px)", transition: "opacity 0.8s ease-out, transform 0.8s ease-out" }}>
          <div className="row-span-2"><LiveFeedTile /></div>
          <ChatTile />
          <StatsTile />
          <VoiceTile />
          <DronesTile />
          <div className="lg:col-span-3 h-[200px]"><MapTile /></div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="relative py-32 overflow-hidden">
        <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover opacity-[0.08]">
          <source src="https://assets.mixkit.co/videos/506/506-720.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0A] via-transparent to-[#0A0A0A]" />
        <div className="relative z-10 text-center px-6">
          <p className="text-[10px] font-mono tracking-[0.5em] uppercase text-[#777] mb-6">Mission Ready</p>
          <h2 className="text-3xl sm:text-5xl font-semibold text-white tracking-tight mb-4">
            See it <span className="text-[#CDFF00] crt-glow">live.</span>
          </h2>
          <p className="text-base text-[#AAA] mb-10 max-w-md mx-auto">
            The full control panel — live video feed, AI chat, telemetry, GPS tracking. All in one interface.
          </p>
          <Link href="/control"
            className="group relative inline-flex items-center gap-3 px-10 py-5 bg-[#CDFF00] text-[#0A0A0A] text-xs font-bold tracking-[0.15em] uppercase hover:bg-[#d8ff33] transition-all duration-300">
            Open Control Panel
            <svg className="w-3 h-3 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" /></svg>
            <div className="absolute inset-0 bg-[#CDFF00] opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500 -z-10" />
          </Link>
        </div>
      </section>
    </div>
  );
}
