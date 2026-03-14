"use client";

import { useState } from "react";
import FadeIn from "@/components/FadeIn";

const droneModels = [
  { name: "Mini 4 Pro", category: "Consumer", img: "https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=300&q=80" },
  { name: "Mavic 3 Pro", category: "Professional", img: "https://images.unsplash.com/photo-1527977966376-1c8408f9f108?w=300&q=80" },
  { name: "Air 3", category: "Consumer", img: "https://images.unsplash.com/photo-1508444845599-5c89863b1c44?w=300&q=80" },
  { name: "Avata 2", category: "FPV", img: "https://images.unsplash.com/photo-1507582020474-9a35b7d455d9?w=300&q=80" },
  { name: "Matrice 350 RTK", category: "Enterprise", img: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=300&q=80" },
  { name: "Other", category: "Custom", img: "" },
];

const connectionSteps = [
  { label: "Drone found on network", delay: 1000 },
  { label: "Firmware compatible", delay: 2000 },
  { label: "Establishing secure link", delay: 3500 },
  { label: "Syncing SkySearch AI module", delay: 5000 },
];

export default function ConnectPage() {
  const [selected, setSelected] = useState<string | null>(null);
  const [pairCode, setPairCode] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [connected, setConnected] = useState(false);

  const handleConnect = () => {
    if (!selected || !pairCode) return;
    setConnecting(true);
    setProgress(0);
    setCompletedSteps([]);
    setConnected(false);

    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          return 100;
        }
        return p + 2;
      });
    }, 100);

    connectionSteps.forEach((step, i) => {
      setTimeout(() => {
        setCompletedSteps((prev) => [...prev, i]);
        if (i === connectionSteps.length - 1) {
          setTimeout(() => {
            setConnected(true);
            setConnecting(false);
          }, 1000);
        }
      }, step.delay);
    });
  };

  return (
    <>
      {/* Hero with video */}
      <section className="relative max-w-7xl mx-auto px-6 lg:px-12 pt-28 pb-16">
        <FadeIn>
          <p className="section-label mb-6">Setup</p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-[#EDEDED] leading-tight">
            Connect your
            <br />
            <span className="text-[#333]">DJI drone</span>
          </h1>
        </FadeIn>
        <FadeIn delay={200}>
          <p className="mt-6 text-base text-[#666] max-w-xl">
            Pair your drone in under 60 seconds. No special hardware — just your existing DJI platform.
          </p>
        </FadeIn>

        {/* Video preview */}
        <FadeIn delay={400}>
          <div className="mt-12 relative border border-[#1A1A1A] bg-[#0A0A0A] aspect-[21/9] overflow-hidden">
            <video
              autoPlay
              muted
              loop
              playsInline
              className="absolute inset-0 w-full h-full object-cover opacity-25"
            >
              <source src="https://assets.mixkit.co/videos/506/506-720.mp4" type="video/mp4" />
            </video>
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <div className="text-center">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-1.5 h-1.5 bg-[#CDFF00] animate-pulse" />
                  <span className="text-xs font-mono text-[#CDFF00] tracking-wider">READY TO PAIR</span>
                </div>
                <p className="text-[10px] text-[#555] font-mono">Waiting for DJI signal...</p>
              </div>
            </div>
            {/* Corner brackets */}
            <div className="absolute top-3 left-3 w-5 h-5 border-t border-l border-[#CDFF00]/20 z-10" />
            <div className="absolute top-3 right-3 w-5 h-5 border-t border-r border-[#CDFF00]/20 z-10" />
            <div className="absolute bottom-3 left-3 w-5 h-5 border-b border-l border-[#CDFF00]/20 z-10" />
            <div className="absolute bottom-3 right-3 w-5 h-5 border-b border-r border-[#CDFF00]/20 z-10" />
          </div>
        </FadeIn>
      </section>

      {/* Setup Wizard */}
      <section className="max-w-7xl mx-auto px-6 lg:px-12 pb-32">
        <FadeIn delay={400}>
          <div className="max-w-3xl mx-auto border border-[#1A1A1A] bg-[#0F0F0F]">
            {/* Step 1 — Select Model */}
            <div className="p-8 border-b border-[#1A1A1A]">
              <div className="flex items-center gap-4 mb-6">
                <span className="font-mono text-xs text-[#CDFF00] tracking-wider">STEP 01</span>
                <span className="h-px flex-1 bg-[#1A1A1A]" />
                <span className="text-xs text-[#555]">Select Your Model</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-[#1A1A1A]">
                {droneModels.map((drone) => (
                  <button
                    key={drone.name}
                    onClick={() => setSelected(drone.name)}
                    className={`text-left transition-colors relative overflow-hidden group ${
                      selected === drone.name
                        ? "bg-[#CDFF00]/5"
                        : "bg-[#0A0A0A] hover:bg-[#111]"
                    }`}
                  >
                    {/* Image background */}
                    {drone.img && (
                      <div className="h-20 overflow-hidden relative">
                        <img
                          src={drone.img}
                          alt={drone.name}
                          className={`w-full h-full object-cover transition-all duration-500 ${
                            selected === drone.name ? "opacity-40" : "opacity-20 group-hover:opacity-30"
                          }`}
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0A0A0A]" />
                      </div>
                    )}
                    {!drone.img && <div className="h-20 bg-[#0A0A0A] flex items-center justify-center">
                      <span className="text-[#2A2A2A] text-2xl font-mono">?</span>
                    </div>}
                    <div className="p-4 relative">
                      <p className="text-xs font-medium text-[#EDEDED]">{drone.name}</p>
                      <p className="text-[9px] text-[#555] mt-1 font-mono">{drone.category}</p>
                      <div className="mt-2">
                        {selected === drone.name ? (
                          <span className="inline-block w-2 h-2 bg-[#CDFF00]" />
                        ) : (
                          <span className="inline-block w-2 h-2 border border-[#2A2A2A]" />
                        )}
                      </div>
                    </div>
                    {selected === drone.name && (
                      <div className="absolute bottom-0 left-0 w-full h-px bg-[#CDFF00]/50" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2 — Pair Code */}
            <div className="p-8 border-b border-[#1A1A1A]">
              <div className="flex items-center gap-4 mb-6">
                <span className="font-mono text-xs text-[#CDFF00] tracking-wider">STEP 02</span>
                <span className="h-px flex-1 bg-[#1A1A1A]" />
                <span className="text-xs text-[#555]">Enter Pair Code</span>
              </div>
              <input
                type="text"
                value={pairCode}
                onChange={(e) => setPairCode(e.target.value)}
                placeholder="DJI-XXXX-XXXX-XXXX"
                className="w-full bg-[#0A0A0A] border border-[#1A1A1A] px-4 py-3.5 text-sm text-[#EDEDED] font-mono placeholder:text-[#333] focus:outline-none focus:border-[#CDFF00]/30 transition-colors"
              />
              <p className="text-[10px] text-[#555] mt-3 font-mono flex items-center gap-2">
                <span className="w-1 h-1 bg-[#555]" />
                DJI Fly app → Settings → Device Info
              </p>
            </div>

            {/* Step 3 — Connect */}
            <div className="p-8">
              <div className="flex items-center gap-4 mb-6">
                <span className="font-mono text-xs text-[#CDFF00] tracking-wider">STEP 03</span>
                <span className="h-px flex-1 bg-[#1A1A1A]" />
                <span className="text-xs text-[#555]">Establish Connection</span>
              </div>

              <button
                onClick={handleConnect}
                disabled={!selected || !pairCode || connecting}
                className={`group inline-flex items-center gap-3 px-8 py-3.5 text-xs font-semibold tracking-[0.1em] uppercase transition-all ${
                  selected && pairCode && !connecting
                    ? "bg-[#CDFF00] text-[#0A0A0A] hover:bg-[#d8ff33] cursor-pointer"
                    : "bg-[#1A1A1A] text-[#555] cursor-not-allowed"
                }`}
              >
                {selected && pairCode && !connecting && (
                  <span className="w-1.5 h-1.5 bg-[#0A0A0A] group-hover:scale-150 transition-transform" />
                )}
                {connected
                  ? "Connected"
                  : connecting
                  ? "Connecting..."
                  : "Connect & Sync"}
              </button>

              {/* Progress */}
              {(connecting || connected) && (
                <div className="mt-8 border border-[#1A1A1A] bg-[#0A0A0A] p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-[#555]">
                      Status:{" "}
                      <span className={connected ? "text-[#22C55E]" : "text-[#CDFF00]"}>
                        {connected ? "Connected" : "Connecting..."}
                      </span>
                    </span>
                    <span className="text-[10px] font-mono text-[#555]">{Math.min(progress, 100)}%</span>
                  </div>

                  <div className="w-full h-1 bg-[#1A1A1A] mb-6">
                    <div
                      className="h-full transition-all duration-200"
                      style={{
                        width: `${Math.min(progress, 100)}%`,
                        backgroundColor: connected ? "#22C55E" : "#CDFF00",
                      }}
                    />
                  </div>

                  <div className="space-y-3">
                    {connectionSteps.map((step, i) => (
                      <div key={i} className="flex items-center gap-3">
                        {completedSteps.includes(i) ? (
                          <span className="w-1.5 h-1.5 bg-[#22C55E]" />
                        ) : (
                          <span className="w-1.5 h-1.5 border border-[#2A2A2A]" />
                        )}
                        <span
                          className={`text-xs font-mono ${
                            completedSteps.includes(i) ? "text-[#888]" : "text-[#333]"
                          }`}
                        >
                          {step.label}
                        </span>
                      </div>
                    ))}
                  </div>

                  {connected && (
                    <div className="mt-6 pt-6 border-t border-[#1A1A1A]">
                      <a
                        href="/control"
                        className="group inline-flex items-center gap-3 text-xs font-semibold text-[#CDFF00] tracking-[0.1em] uppercase hover:text-[#d8ff33] transition-colors"
                      >
                        <span className="w-1.5 h-1.5 bg-[#CDFF00] group-hover:scale-150 transition-transform" />
                        Open Control Panel →
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </FadeIn>
      </section>
    </>
  );
}
