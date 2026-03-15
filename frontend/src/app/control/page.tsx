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

// ─── Component ────────────────────────────────────────────────────────────────

export default function ControlPanel() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
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
      {/* Header bar */}
      <div className="border-b border-[#2A2A2A] px-4 lg:px-6 py-3 flex items-center justify-between shrink-0 bg-[#0F0F0F]">
        <h1 className="text-sm font-semibold tracking-wide text-white">Control Panel</h1>
        <div className="flex items-center gap-3">
          {/* Mobile tab switcher */}
          <div className="flex lg:hidden border border-[#333] rounded-md overflow-hidden">
            <button
              onClick={() => setMobileTab("control")}
              className={`px-4 py-1.5 text-xs transition-all ${mobileTab === "control" ? "bg-[#2A2A2A] text-white" : "text-[#999]"}`}
            >
              Control
            </button>
            <button
              onClick={() => setMobileTab("status")}
              className={`px-4 py-1.5 text-xs transition-all ${mobileTab === "status" ? "bg-[#2A2A2A] text-white" : "text-[#999]"}`}
            >
              Status
            </button>
          </div>
          {isSpeaking && (
            <span className="hidden lg:block text-xs text-[#CCC]">Speaking...</span>
          )}
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#22C55E] shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
            <span className="hidden sm:block text-xs text-[#CCC] font-medium">Connected</span>
          </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_340px] min-h-0">
        {/* LEFT COLUMN */}
        <div className={`flex-col border-r border-[#2A2A2A] overflow-hidden ${mobileTab === "control" ? "flex" : "hidden"} lg:flex`}>

          {/* Video Feed */}
          <div className="relative bg-[#0F0F0F] m-3 border border-[#333] rounded-lg overflow-hidden shrink-0 h-[28%] lg:h-[42%] shadow-lg">
            {/* Detection overlays */}
            <div className="absolute top-[30%] left-[25%] w-20 h-28 border-2 border-[#CDFF00] rounded shadow-[0_0_12px_rgba(205,255,0,0.4)]">
              <div className="absolute -top-6 left-0 text-[10px] font-bold text-[#CDFF00] bg-[#CDFF00]/25 px-2 py-0.5 rounded whitespace-nowrap shadow-lg">
                Person — 94%
              </div>
            </div>
            <div className="absolute top-[40%] right-[20%] w-16 h-12 border-2 border-[#F59E0B] rounded shadow-[0_0_12px_rgba(245,158,11,0.4)]">
              <div className="absolute -top-6 left-0 text-[10px] font-bold text-[#F59E0B] bg-[#F59E0B]/25 px-2 py-0.5 rounded whitespace-nowrap shadow-lg">
                Vehicle — 87%
              </div>
            </div>
            {/* Background video */}
            <video
              autoPlay
              muted
              loop
              playsInline
              className="absolute inset-0 w-full h-full object-cover opacity-40"
            >
              <source src="https://assets.mixkit.co/videos/506/506-720.mp4" type="video/mp4" />
            </video>
            {/* Bottom info bar */}
            <div className="absolute bottom-0 left-0 right-0 bg-[#0F0F0F]/95 backdrop-blur-sm border-t border-[#333] px-4 py-2 flex items-center gap-6">
              <span className="text-xs text-[#CCC] font-medium">45.2m altitude</span>
              <span className="text-xs text-[#CCC] font-medium">12 km/h</span>
              <span className="text-xs text-[#CDFF00] ml-auto flex items-center gap-1.5 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#CDFF00] shadow-[0_0_6px_rgba(205,255,0,0.8)]" />
                AI Active
              </span>
              <span className="text-xs text-red-400 flex items-center gap-1.5 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_6px_rgba(239,68,68,0.8)]" />
                Recording
              </span>
            </div>
          </div>

          {/* Chat */}
          <div className="flex-1 flex flex-col m-3 mt-0 border border-[#333] rounded-lg overflow-hidden min-h-0 shadow-lg bg-[#0F0F0F]">

            {/* Chat header */}
            <div className="px-4 py-3 border-b border-[#2A2A2A] flex items-center justify-between shrink-0">
              <h3 className="text-sm font-semibold text-white">Command Center</h3>
              <button
                onClick={toggleVoice}
                title={voiceEnabled ? "Mute AI voice" : "Unmute AI voice"}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs transition-all ${
                  voiceEnabled
                    ? "bg-[#2A2A2A] text-white border border-[#333]"
                    : "text-[#999] hover:text-white"
                }`}
              >
                {voiceEnabled ? (
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>
                )}
                {voiceEnabled ? "Voice on" : "Voice off"}
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`rounded-lg p-3 max-w-[85%] border ${
                    msg.role === "ai"
                      ? "bg-[#151515] mr-auto border-[#2A2A2A]"
                      : "bg-[#1F1F1F] ml-auto border-[#333]"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-[10px] font-bold text-[#999] tracking-wide uppercase">
                      {msg.role === "ai" ? "SkySearch AI" : "You"}
                    </p>
                    {msg.role === "ai" && speakingId === msg.id && (
                      <span className="text-[10px] text-[#CDFF00]">speaking...</span>
                    )}
                  </div>
                  <p className="text-sm text-[#E5E5E5] leading-relaxed font-medium">
                    {msg.displayText}
                    {msg.role === "ai" && msg.displayText.length < msg.text.length && (
                      <span className="inline-block w-0.5 h-3.5 bg-[#CDFF00] ml-0.5 align-middle animate-pulse" />
                    )}
                  </p>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Input area */}
            <div className="p-3 border-t border-[#2A2A2A] shrink-0 bg-[#0F0F0F]">

              {(isListening || transcript) && (
                <div className="mb-2 px-3 py-2.5 rounded-lg border border-[#333] bg-[#1A1A1A] flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                  <span className="text-sm text-[#E5E5E5] flex-1 truncate font-medium">
                    {isListening && !transcript ? "Listening..." : transcript || "Processing..."}
                  </span>
                  {isListening && (
                    <button
                      onClick={stopListening}
                      className="text-xs text-[#CCC] hover:text-white transition-colors font-medium"
                    >
                      Stop
                    </button>
                  )}
                </div>
              )}

              {/* Quick commands */}
              <div className="flex gap-2 mb-2 overflow-x-auto pb-1">
                {quickCommands.map((cmd) => (
                  <button
                    key={cmd}
                    onClick={() => sendMessage(cmd)}
                    className="border border-[#333] rounded-full px-3.5 py-1.5 text-xs text-[#BBB] font-medium hover:text-white hover:border-[#CDFF00]/50 hover:bg-[#1A1A1A] transition-colors whitespace-nowrap shrink-0"
                  >
                    {cmd}
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
                  placeholder="Type a command..."
                  className="flex-1 bg-[#1A1A1A] border border-[#333] rounded-lg px-4 py-3 text-sm text-white placeholder:text-[#777] focus:outline-none focus:border-[#CDFF00]/50 focus:shadow-[0_0_0_3px_rgba(205,255,0,0.1)] transition-all"
                />

                <button
                  onClick={isListening ? stopListening : startListening}
                  title={isListening ? "Stop listening" : "Voice command"}
                  className={`w-11 h-11 rounded-lg flex items-center justify-center transition-all border ${
                    isListening
                      ? "bg-red-500/25 border-red-500/50 shadow-[0_0_12px_rgba(239,68,68,0.4)]"
                      : "bg-[#2A2A2A] hover:bg-[#333] border-[#444]"
                  }`}
                >
                  <svg viewBox="0 0 24 24" className={`w-4.5 h-4.5 ${isListening ? "text-red-400" : "text-[#CCC]"}`} fill="currentColor">
                    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                    <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                  </svg>
                </button>

                <button
                  onClick={() => sendMessage(input)}
                  className="w-11 h-11 bg-[#CDFF00] rounded-lg flex items-center justify-center hover:bg-[#d8ff33] transition-colors"
                >
                  <svg viewBox="0 0 24 24" className="w-4.5 h-4.5 text-[#0A0A0A]" fill="currentColor">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className={`flex-col overflow-y-auto ${mobileTab === "status" ? "flex" : "hidden"} lg:flex`}>

          {/* Drone Status */}
          <div className="p-4">
            <h3 className="text-xs font-semibold text-[#CCC] mb-3 uppercase tracking-wider">
              Drone Status
            </h3>
            <div className="bg-[#151515] border border-[#2A2A2A] rounded-lg p-4 space-y-4 shadow-lg">
              {/* Battery with bar */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-[#CCC] font-medium">Battery</span>
                  <span className="text-white font-bold">78%</span>
                </div>
                <div className="w-full h-2 bg-[#2A2A2A] rounded-full overflow-hidden border border-[#333]">
                  <div className="h-full w-[78%] bg-[#22C55E] rounded-full shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                </div>
              </div>
              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Altitude",    value: "45.2m" },
                  { label: "Speed",       value: "12 km/h" },
                  { label: "Signal",      value: "Strong" },
                  { label: "Temperature", value: "32\u00B0C" },
                  { label: "Flight time", value: "14 min" },
                  { label: "GPS",         value: "48.85\u00B0N" },
                ].map((item) => (
                  <div key={item.label}>
                    <p className="text-xs text-[#999] mb-0.5 font-medium">{item.label}</p>
                    <p className="text-sm text-white font-semibold">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Map */}
          <div className="px-4 pb-4">
            <h3 className="text-xs font-semibold text-[#CCC] mb-3 uppercase tracking-wider">
              Live Location
            </h3>
            <div className="bg-[#151515] border border-[#2A2A2A] rounded-lg overflow-hidden shadow-lg">
              <svg viewBox="0 0 300 180" className="w-full" style={{ display: "block" }}>
                <rect width="300" height="180" fill="#151515" rx="0" />
                {/* Grid */}
                {[0,1,2,3,4].map((i) => (
                  <line key={`v${i}`} x1={i * 75} y1="0" x2={i * 75} y2="180" stroke="#2A2A2A" strokeWidth="1" />
                ))}
                {[0,1,2,3].map((i) => (
                  <line key={`h${i}`} x1="0" y1={i * 60} x2="300" y2={i * 60} stroke="#2A2A2A" strokeWidth="1" />
                ))}
                {/* Home marker */}
                <circle cx="150" cy="90" r="5" fill="none" stroke="#22C55E" strokeWidth="2" />
                <text x="160" y="93" fill="#AAA" fontSize="9" fontFamily="sans-serif" fontWeight="600">Home</text>
                {/* Search radius */}
                <circle cx="150" cy="90" r="60" fill="none" stroke="#333" strokeWidth="1.5" strokeDasharray="4 3" />
                {/* Flight path */}
                {flightPath.length > 1 && (
                  <polyline
                    points={flightPath.map((p) => `${p.x},${p.y}`).join(" ")}
                    fill="none"
                    stroke="#888"
                    strokeWidth="2"
                    strokeOpacity="0.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}
                {/* Drone position */}
                <circle cx={dronePos.x} cy={dronePos.y} r="5" fill="#CDFF00" filter="url(#glow)" />
                <circle cx={dronePos.x} cy={dronePos.y} r="2.5" fill="#0F0F0F" />
                <defs>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
              </svg>
              <div className="px-4 py-2.5 border-t border-[#2A2A2A] flex items-center justify-between">
                <span className="text-xs text-[#AAA] font-medium">Live tracking</span>
                <span className="text-xs text-[#CCC] font-mono">
                  {(48.85 + (dronePos.x - 150) * 0.0002).toFixed(4)}°N,{" "}
                  {(2.35 + (dronePos.y - 90) * 0.0002).toFixed(4)}°E
                </span>
              </div>
            </div>
          </div>

          {/* AI Info */}
          <div className="px-4 pb-4">
            <h3 className="text-xs font-semibold text-[#CCC] mb-3 uppercase tracking-wider">
              AI Detection
            </h3>
            <div className="bg-[#151515] border border-[#2A2A2A] rounded-lg p-4 grid grid-cols-2 gap-3 shadow-lg">
              {[
                { label: "Status",      value: "Active",     color: "#22C55E" },
                { label: "Known faces", value: "12 loaded",  color: "#22C55E" },
                { label: "Detections",  value: "847",        color: "#CDFF00" },
                { label: "Area covered",value: "3.2 km\u00B2",color: "#CDFF00" },
              ].map((item) => (
                <div key={item.label}>
                  <p className="text-xs text-[#999] mb-0.5 font-medium">{item.label}</p>
                  <p className="text-sm font-bold" style={{ color: item.color }}>{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Events */}
          <div className="px-4 pb-4 flex-1">
            <h3 className="text-xs font-semibold text-[#CCC] mb-3 uppercase tracking-wider">
              Recent Activity
            </h3>
            <div className="bg-[#151515] border border-[#2A2A2A] rounded-lg p-4 space-y-3 shadow-lg">
              {notifications.map((n, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <span className="text-xs text-[#888] shrink-0 mt-0.5 font-mono font-medium">{n.time}</span>
                  <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 shadow-[0_0_6px_currentColor]" style={{ backgroundColor: n.accent, color: n.accent }} />
                  <span className="text-sm text-[#CCC] font-medium">{n.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
