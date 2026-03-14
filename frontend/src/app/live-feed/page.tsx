"use client";

import { useState, useEffect } from "react";
import FadeIn from "@/components/FadeIn";

const captures = [
  { time: "14:02:15", type: "Person", confidence: "94%", accent: "#CDFF00" },
  { time: "14:05:33", type: "Vehicle", confidence: "87%", accent: "#F59E0B" },
  { time: "14:12:01", type: "Person", confidence: "91%", accent: "#CDFF00" },
  { time: "14:18:47", type: "Object", confidence: "76%", accent: "#888" },
  { time: "14:22:03", type: "Person", confidence: "89%", accent: "#CDFF00" },
  { time: "14:28:19", type: "Animal", confidence: "82%", accent: "#22C55E" },
];

export default function LiveFeedPage() {
  const [scanY, setScanY] = useState(0);
  const [recording, setRecording] = useState(true);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [elapsed, setElapsed] = useState(872);

  useEffect(() => {
    const scanInterval = setInterval(() => {
      setScanY((prev) => (prev >= 100 ? 0 : prev + 0.3));
    }, 30);
    const timeInterval = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => {
      clearInterval(scanInterval);
      clearInterval(timeInterval);
    };
  }, []);

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600).toString().padStart(2, "0");
    const m = Math.floor((s % 3600) / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${h}:${m}:${sec}`;
  };

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
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-cover opacity-25"
          >
            <source src="https://assets.mixkit.co/videos/506/506-720.mp4" type="video/mp4" />
          </video>

          {/* HUD Bottom */}
          <div className="absolute bottom-0 left-0 right-0 bg-[#0A0A0A] border-t border-[#1A1A1A] px-4 py-2.5 flex items-center gap-6">
            <span className="text-[10px] font-mono text-[#555]">ALT 45m</span>
            <span className="text-[10px] font-mono text-[#555]">SPD 12km/h</span>
            <span className="text-[10px] font-mono text-[#555]">GPS 48.85°N 2.35°E</span>
            <span className="text-[10px] font-mono ml-auto" style={{ color: aiEnabled ? "#CDFF00" : "#555" }}>
              AI: {aiEnabled ? "ON" : "OFF"}
            </span>
            {recording && (
              <span className="text-[10px] font-mono text-red-400 flex items-center gap-1.5">
                <span className="w-1 h-1 bg-red-500" />
                REC {formatTime(elapsed)}
              </span>
            )}
          </div>
        </div>
      </FadeIn>

      {/* Controls */}
      <FadeIn delay={200}>
        <div className="flex flex-wrap gap-2 mt-4">
          {[
            { label: recording ? "Stop Recording" : "Record", onClick: () => setRecording(!recording), active: recording, activeColor: "text-red-400" },
            { label: "Screenshot", onClick: () => {}, active: false, activeColor: "" },
            { label: `AI ${aiEnabled ? "ON" : "OFF"}`, onClick: () => setAiEnabled(!aiEnabled), active: aiEnabled, activeColor: "text-[#CDFF00]" },
            { label: "Night Mode", onClick: () => {}, active: false, activeColor: "" },
            { label: "Fullscreen", onClick: () => {}, active: false, activeColor: "" },
          ].map((btn) => (
            <button
              key={btn.label}
              onClick={btn.onClick}
              className={`border border-[#1A1A1A] px-4 py-2 text-xs font-mono tracking-wider uppercase transition-colors hover:border-[#2A2A2A] hover:bg-[#111] ${
                btn.active ? btn.activeColor : "text-[#888]"
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
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
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div
                      className="w-6 h-8 border border-dashed opacity-30"
                      style={{ borderColor: cap.accent }}
                    />
                  </div>
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
