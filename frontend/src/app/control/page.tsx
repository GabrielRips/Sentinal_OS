"use client";

import { useState, useRef, useEffect, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  id: number;
  role: "ai" | "user";
  text: string;
  displayText: string;
}

interface Notification {
  time: string;
  text: string;
  accent: string;
}

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
  { time: "14:02", text: "Person detected — Sector 4, 94% match", accent: "#CDFF00" },
  { time: "14:01", text: "Entering search zone B", accent: "#22C55E" },
  { time: "13:58", text: "Mission started — scanning 4 sectors", accent: "#888" },
  { time: "13:57", text: "AI model loaded, ready", accent: "#22C55E" },
];

const quickCommands = ["Search area", "Find my friend", "Return home", "Hover", "Take photo", "Land"];

const aiResponses: Record<string, string> = {
  search: "Beginning area search pattern. Scanning sector 1 of 4. Altitude set to 45m for optimal coverage. I'll alert you the moment anything is detected.",
  find: "Activating face recognition and scanning the area. Cross-referencing 12 loaded profiles against live feed. Stay close — I'll call it out when I get a match.",
  friend: "Activating face recognition and scanning the area. Cross-referencing 12 loaded profiles against live feed. Stay close — I'll call it out when I get a match.",
  return: "Returning to home position. ETA 45 seconds. Current distance: 320m. Plotting optimal return path now.",
  hover: "Holding position. Altitude: 45.2m. Wind speed: 8 km/h NW. Stable hover confirmed. I'll stay here until your next command.",
  photo: "Capturing high-resolution photo… Done. Image saved. Resolution: 5472×3648. No additional targets detected in frame.",
  land: "Initiating landing sequence. Checking landing zone — clear. Descending at 1.5 m/s. Stand by.",
  scan: "Switching to expanded scan mode. Increasing search radius to 200m and activating thermal imaging overlay.",
  default: "Command received. Processing your request now. Adjusting flight parameters and updating mission objectives. I'll keep you updated on progress.",
};

function getResponse(text: string): string {
  const lower = text.toLowerCase();
  for (const [key, resp] of Object.entries(aiResponses)) {
    if (key !== "default" && lower.includes(key)) return resp;
  }
  return aiResponses.default;
}

// ─── Waveform Bars ─────────────────────────────────────────────────────────────

function WaveformBars({
  active,
  color = "#888",
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
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [scanY, setScanY] = useState(0);
  const [notifications] = useState<Notification[]>(initialNotifications);

  const [dronePos, setDronePos] = useState({ x: 150, y: 90 });
  const [flightPath, setFlightPath] = useState<{ x: number; y: number }[]>([{ x: 150, y: 90 }]);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingId, setSpeakingId] = useState<number | null>(null);
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  const [mobileTab, setMobileTab] = useState<"control" | "status">("control");

  const chatEndRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const idRef = useRef(initialMessages.length);
  const voiceEnabledRef = useRef(voiceEnabled);

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
    let t = 0;
    const iv = setInterval(() => {
      t += 0.012;
      const x = 150 + Math.sin(t) * 80;
      const y = 90 + Math.sin(t * 1.3) * 50;
      setDronePos({ x, y });
      setFlightPath((prev) => {
        const next = [...prev, { x, y }];
        return next.length > 60 ? next.slice(next.length - 60) : next;
      });
    }, 80);
    return () => clearInterval(iv);
  }, []);

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

  const sendMessage = useCallback(
    (text: string) => {
      if (!text.trim()) return;
      const id = ++idRef.current;
      setMessages((prev) => [...prev, { id, role: "user", text, displayText: text }]);
      setInput("");
      setTranscript("");
      setTimeout(() => addAIMessage(getResponse(text)), 600);
    },
    [addAIMessage]
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

  return (
    <div className="fixed left-0 right-0 top-14 bottom-0 bg-[#0A0A0A] flex flex-col overflow-hidden">
      {/* Sub-header */}
      <div className="border-b border-[#1A1A1A] px-4 lg:px-6 py-3 flex items-center justify-between shrink-0">
        <h1 className="text-xs font-medium tracking-[0.15em] uppercase text-[#EDEDED]">SkySearch Control</h1>
        <div className="flex items-center gap-3">
          {/* Mobile tab switcher */}
          <div className="flex lg:hidden border border-[#1A1A1A] p-0.5 gap-0.5">
            <button
              onClick={() => setMobileTab("control")}
              className={`px-3 py-1 text-[10px] font-mono tracking-wider transition-all ${mobileTab === "control" ? "bg-[#1A1A1A] text-[#EDEDED]" : "text-[#555]"}`}
            >
              CONTROL
            </button>
            <button
              onClick={() => setMobileTab("status")}
              className={`px-3 py-1 text-[10px] font-mono tracking-wider transition-all ${mobileTab === "status" ? "bg-[#1A1A1A] text-[#EDEDED]" : "text-[#555]"}`}
            >
              STATUS
            </button>
          </div>
          {isSpeaking && (
            <div className="hidden lg:flex items-center gap-2">
              <WaveformBars active bars={7} color="#888" />
              <span className="text-[9px] font-mono text-[#555] tracking-wider">AI SPEAKING</span>
            </div>
          )}
          <span className="w-1.5 h-1.5 bg-[#22C55E]" />
          <span className="hidden sm:block text-[10px] text-[#555] font-mono tracking-wider">
            DJI MAVIC 3 PRO
          </span>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_320px] min-h-0">
        {/* LEFT COLUMN */}
        <div className={`flex-col border-r border-[#1A1A1A] overflow-hidden ${mobileTab === "control" ? "flex" : "hidden"} lg:flex`}>

          {/* Video Feed */}
          <div className="relative bg-[#0A0A0A] m-2 lg:m-3 border border-[#1A1A1A] overflow-hidden shrink-0 h-[28%] lg:h-[42%]">
            <div
              className="absolute left-0 right-0 h-px bg-[#CDFF00]/15"
              style={{ top: `${scanY}%` }}
            />
            {/* Corner brackets */}
            <div className="absolute top-3 left-3 w-6 h-6 border-t border-l border-[#2A2A2A]" />
            <div className="absolute top-3 right-3 w-6 h-6 border-t border-r border-[#2A2A2A]" />
            <div className="absolute bottom-10 left-3 w-6 h-6 border-b border-l border-[#2A2A2A]" />
            <div className="absolute bottom-10 right-3 w-6 h-6 border-b border-r border-[#2A2A2A]" />
            {/* Detection overlays */}
            <div className="absolute top-[30%] left-[25%] w-20 h-28 border border-[#CDFF00]/60 border-dashed">
              <div className="absolute -top-5 left-0 text-[8px] font-mono text-[#CDFF00] bg-[#CDFF00]/10 px-1.5 py-0.5 whitespace-nowrap">
                PERSON 94%
              </div>
            </div>
            <div className="absolute top-[40%] right-[20%] w-16 h-12 border border-[#F59E0B]/40 border-dashed">
              <div className="absolute -top-5 left-0 text-[8px] font-mono text-[#F59E0B] bg-[#F59E0B]/10 px-1.5 py-0.5 whitespace-nowrap">
                VEHICLE 87%
              </div>
            </div>
            {/* Background video */}
            <video
              autoPlay
              muted
              loop
              playsInline
              className="absolute inset-0 w-full h-full object-cover opacity-25"
            >
              <source src="https://assets.mixkit.co/videos/506/506-720.mp4" type="video/mp4" />
            </video>
            {/* HUD bar */}
            <div className="absolute bottom-0 left-0 right-0 bg-[#0A0A0A] border-t border-[#1A1A1A] px-3 py-1.5 flex items-center gap-5">
              <span className="text-[9px] font-mono text-[#555]">ALT 45.2m</span>
              <span className="text-[9px] font-mono text-[#555]">SPD 12km/h</span>
              <span className="text-[9px] font-mono text-[#555]">GPS 48.85°N 2.35°E</span>
              <span className="text-[9px] font-mono text-[#CDFF00] ml-auto">AI: ACTIVE</span>
              <span className="text-[9px] font-mono text-red-400 flex items-center gap-1">
                <span className="w-1 h-1 bg-red-500" />
                REC
              </span>
            </div>
          </div>

          {/* Video controls */}
          <div className="px-2 lg:px-3 pb-1 lg:pb-2 flex gap-1.5 shrink-0">
            <button className="border border-[#1A1A1A] px-3 py-1.5 text-[10px] font-mono text-red-400 hover:bg-[#111] transition-colors tracking-wider">
              REC
            </button>
            <button className="border border-[#1A1A1A] px-3 py-1.5 text-[10px] font-mono text-[#888] hover:bg-[#111] transition-colors tracking-wider">
              CAPTURE
            </button>
            <button className="border border-[#1A1A1A] px-3 py-1.5 text-[10px] font-mono text-[#CDFF00] hover:bg-[#111] transition-colors tracking-wider">
              AI: ON
            </button>
          </div>

          {/* LLM Chat */}
          <div className="flex-1 flex flex-col m-2 mt-1 lg:m-3 lg:mt-1 border border-[#1A1A1A] overflow-hidden min-h-0">

            {/* Chat header */}
            <div className="px-4 py-3 border-b border-[#1A1A1A] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <h3 className="text-[10px] font-medium tracking-[0.15em] uppercase text-[#EDEDED]">Command Center</h3>
                {isSpeaking && (
                  <div className="flex items-center gap-1.5">
                    <WaveformBars active bars={5} color="#888" />
                    <span className="text-[8px] font-mono text-[#555] tracking-wider">SPEAKING</span>
                  </div>
                )}
              </div>

              <button
                onClick={toggleVoice}
                title={voiceEnabled ? "Mute AI voice" : "Unmute AI voice"}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-[9px] font-mono tracking-wider transition-all ${
                  voiceEnabled
                    ? "bg-[#1A1A1A] text-[#EDEDED]"
                    : "text-[#555] hover:text-[#888]"
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
                  className={`border border-[#1A1A1A] p-3 max-w-[85%] ${
                    msg.role === "ai"
                      ? "border-l-2 border-l-[#2A2A2A] mr-auto"
                      : "border-l-2 border-l-[#555] ml-auto"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-[9px] font-mono text-[#555] tracking-wider">
                      {msg.role === "ai" ? "SKYSEARCH AI" : "OPERATOR"}
                    </p>
                    {msg.role === "ai" && speakingId === msg.id && (
                      <WaveformBars active bars={4} color="#888" />
                    )}
                  </div>
                  <p className="text-xs text-[#888] leading-relaxed">
                    {msg.displayText}
                    {msg.role === "ai" && msg.displayText.length < msg.text.length && (
                      <span className="inline-block w-0.5 h-3 bg-[#555] ml-0.5 align-middle animate-pulse" />
                    )}
                  </p>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Input area */}
            <div className="p-3 border-t border-[#1A1A1A] shrink-0">

              {(isListening || transcript) && (
                <div className="mb-2 px-3 py-2 border border-[#1A1A1A] bg-[#111] flex items-center gap-2.5">
                  <WaveformBars active={isListening} bars={6} color="#888" />
                  <span className="text-[10px] text-[#888] font-mono flex-1 truncate">
                    {isListening && !transcript ? "Listening…" : transcript || "Processing…"}
                  </span>
                  {isListening && (
                    <button
                      onClick={stopListening}
                      className="text-[8px] font-mono text-[#555] hover:text-[#EDEDED] transition-colors tracking-wider"
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
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
                  placeholder="Type a command…"
                  className="flex-1 bg-[#0A0A0A] border border-[#1A1A1A] px-4 py-3 text-xs text-[#EDEDED] placeholder:text-[#333] focus:outline-none focus:border-[#2A2A2A]"
                />

                <button
                  onClick={isListening ? stopListening : startListening}
                  title={isListening ? "Stop listening" : "Start voice command"}
                  className={`w-10 h-10 flex items-center justify-center transition-all ${
                    isListening
                      ? "bg-[#EDEDED]"
                      : "bg-[#1A1A1A] hover:bg-[#2A2A2A]"
                  }`}
                >
                  {isListening ? (
                    <WaveformBars active bars={5} color="#0A0A0A" />
                  ) : (
                    <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#888]" fill="currentColor">
                      <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                      <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                    </svg>
                  )}
                </button>

                <button
                  onClick={() => sendMessage(input)}
                  className="w-10 h-10 bg-[#EDEDED] flex items-center justify-center hover:bg-white transition-colors"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#0A0A0A]" fill="currentColor">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                  </svg>
                </button>
              </div>

              <div className="hidden sm:flex gap-1.5 mt-2 overflow-x-auto pb-1">
                {quickCommands.map((cmd) => (
                  <button
                    key={cmd}
                    onClick={() => sendMessage(cmd)}
                    className="border border-[#1A1A1A] px-3 py-1 text-[10px] font-mono text-[#555] hover:text-[#EDEDED] hover:border-[#2A2A2A] transition-colors whitespace-nowrap shrink-0 tracking-wider"
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

          {/* Telemetry */}
          <div className="p-4">
            <h3 className="text-[9px] font-medium text-[#555] uppercase tracking-[0.2em] mb-4">
              Telemetry
            </h3>
            <div className="border border-[#1A1A1A] p-4 space-y-4">
              <div>
                <div className="flex justify-between text-[10px] mb-1.5">
                  <span className="text-[#555] font-mono">BATTERY</span>
                  <span className="font-mono text-[#EDEDED]">78%</span>
                </div>
                <div className="w-full h-1 bg-[#1A1A1A]">
                  <div className="h-full w-[78%] bg-[#22C55E]" />
                </div>
              </div>
              {[
                { label: "ALTITUDE",    value: "45.2m" },
                { label: "SPEED",       value: "12 km/h" },
                { label: "GPS",         value: "48.85\u00B0N, 2.35\u00B0E" },
                { label: "SIGNAL",      value: "Strong" },
                { label: "TEMP",        value: "32\u00B0C" },
                { label: "FLIGHT TIME", value: "00:14:32" },
              ].map((item) => (
                <div key={item.label} className="flex justify-between text-[10px]">
                  <span className="text-[#555] font-mono">{item.label}</span>
                  <span className="font-mono text-[#EDEDED]">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* GPS Map */}
          <div className="px-4 pb-4">
            <h3 className="text-[9px] font-medium text-[#555] uppercase tracking-[0.2em] mb-4">
              GPS Tracker
            </h3>
            <div className="border border-[#1A1A1A] overflow-hidden">
              <svg viewBox="0 0 300 180" className="w-full" style={{ display: "block" }}>
                <rect width="300" height="180" fill="#0A0A0A" />
                {[0,1,2,3,4].map((i) => (
                  <line key={`v${i}`} x1={i * 75} y1="0" x2={i * 75} y2="180" stroke="#1A1A1A" strokeWidth="1" />
                ))}
                {[0,1,2,3].map((i) => (
                  <line key={`h${i}`} x1="0" y1={i * 60} x2="300" y2={i * 60} stroke="#1A1A1A" strokeWidth="1" />
                ))}
                {[["A", 37, 20], ["B", 187, 20], ["C", 37, 110], ["D", 187, 110]].map(([label, x, y]) => (
                  <text key={label as string} x={x as number} y={y as number} fill="#1A1A1A" fontSize="22" fontWeight="bold" fontFamily="monospace">{label}</text>
                ))}
                <circle cx="150" cy="90" r="4" fill="none" stroke="#22C55E" strokeWidth="1" />
                <text x="155" y="86" fill="#555" fontSize="7" fontFamily="monospace">HOME</text>
                <circle cx="150" cy="90" r="60" fill="none" stroke="#1A1A1A" strokeWidth="1" strokeDasharray="4 3" />
                {flightPath.length > 1 && (
                  <polyline
                    points={flightPath.map((p) => `${p.x},${p.y}`).join(" ")}
                    fill="none"
                    stroke="#555"
                    strokeWidth="1"
                    strokeOpacity="0.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}
                <circle cx={dronePos.x} cy={dronePos.y} r="3" fill="#CDFF00" />
                <circle cx={dronePos.x} cy={dronePos.y} r="1.5" fill="#0A0A0A" />
              </svg>
              <div className="px-3 py-2 border-t border-[#1A1A1A] flex items-center justify-between">
                <span className="text-[8px] font-mono text-[#555] tracking-wider">LIVE TRACK</span>
                <span className="text-[8px] font-mono text-[#888]">
                  {(48.85 + (dronePos.x - 150) * 0.0002).toFixed(4)}°N&nbsp;
                  {(2.35 + (dronePos.y - 90) * 0.0002).toFixed(4)}°E
                </span>
              </div>
            </div>
          </div>

          {/* AI Status */}
          <div className="px-4 pb-4">
            <h3 className="text-[9px] font-medium text-[#555] uppercase tracking-[0.2em] mb-4">
              AI Status
            </h3>
            <div className="border border-[#1A1A1A] p-4 space-y-3">
              {[
                { label: "MODEL",            value: "Active",   accent: "#22C55E" },
                { label: "FACES DB",         value: "12 loaded", accent: "#22C55E" },
                { label: "OBJECTS DETECTED", value: "847",       accent: "#CDFF00" },
                { label: "AREA SCANNED",     value: "3.2 km\u00B2", accent: "#CDFF00" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between text-[10px]">
                  <div className="flex items-center gap-2">
                    <span className="w-1 h-1" style={{ backgroundColor: item.accent }} />
                    <span className="text-[#555] font-mono">{item.label}</span>
                  </div>
                  <span className="font-mono text-[#EDEDED]">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Notifications */}
          <div className="px-4 pb-4 flex-1">
            <h3 className="text-[9px] font-medium text-[#555] uppercase tracking-[0.2em] mb-4">
              Events
            </h3>
            <div className="border border-[#1A1A1A] p-4 space-y-3">
              {notifications.map((n, i) => (
                <div key={i} className="flex gap-3 text-[10px]">
                  <span className="font-mono text-[#333] shrink-0">{n.time}</span>
                  <span className="w-1 h-1 mt-1.5 shrink-0" style={{ backgroundColor: n.accent }} />
                  <span className="text-[#888]">{n.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
