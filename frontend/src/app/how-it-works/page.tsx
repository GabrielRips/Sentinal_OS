"use client";

import Link from "next/link";
import FadeIn from "@/components/FadeIn";

const techSections = [
  {
    num: "01",
    tag: "PERCEPTION",
    title: "AI Vision Engine",
    desc: "Onboard neural network processes live video at 30fps. Facial recognition and object detection with 99.2% accuracy across all lighting conditions — daylight, dusk, or complete darkness with IR.",
    bullets: ["Facial recognition", "Object classification", "Scene understanding", "Night vision compatible"],
    img: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&q=80",
  },
  {
    num: "02",
    tag: "COMMAND",
    title: "Natural Language Control",
    desc: "Speak to your drone like a teammate. The LLM converts plain English into precise flight commands, handles ambiguity, and asks for clarification when needed.",
    bullets: ['"Go check behind the building"', '"Search the north field"', '"Come back to base"', '"Take a photo of that person"'],
    img: "https://images.unsplash.com/photo-1527977966376-1c8408f9f108?w=800&q=80",
  },
  {
    num: "03",
    tag: "AUTONOMY",
    title: "Autonomous Path Planning",
    desc: "AI-powered navigation plans optimal search patterns, avoids obstacles, and covers maximum area in minimum time. Battery-aware routing ensures safe return.",
    bullets: ["Grid search patterns", "Obstacle avoidance", "Wind compensation", "Battery-aware routing"],
    img: "https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=800&q=80",
  },
  {
    num: "04",
    tag: "ALERTS",
    title: "Live Alerts & Notifications",
    desc: "The moment SkySearch detects a match, you receive an instant notification with photo, location, and confidence score. Multi-channel delivery ensures you never miss a detection.",
    bullets: ["Push notifications", "Voice announcements", "SMS/text alerts", "In-app live feed"],
    img: "https://images.unsplash.com/photo-1508444845599-5c89863b1c44?w=800&q=80",
  },
  {
    num: "05",
    tag: "HARDWARE",
    title: "Universal DJI Compatibility",
    desc: "SkySearch integrates with the DJI SDK, adding AI capabilities to your existing hardware. No custom drone needed — connect what you already own.",
    bullets: ["Consumer (Mini, Air, Mavic)", "Professional (Inspire, Phantom)", "Enterprise (Matrice, Flycart)", "Automatic firmware detection"],
    img: "https://images.unsplash.com/photo-1579829366248-204fe8413f31?w=800&q=80",
  },
];

const djiDrones = [
  { name: "Mini 4 Pro", img: "https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=200&q=80" },
  { name: "Mavic 3 Pro", img: "https://images.unsplash.com/photo-1527977966376-1c8408f9f108?w=200&q=80" },
  { name: "Air 3", img: "https://images.unsplash.com/photo-1508444845599-5c89863b1c44?w=200&q=80" },
  { name: "Avata 2", img: "https://images.unsplash.com/photo-1507582020474-9a35b7d455d9?w=200&q=80" },
  { name: "Matrice 350 RTK", img: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=200&q=80" },
  { name: "Phantom 4 Pro V2", img: "https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=200&q=80" },
  { name: "Inspire 3", img: "https://images.unsplash.com/photo-1527977966376-1c8408f9f108?w=200&q=80" },
  { name: "50+ More", img: "" },
];

export default function HowItWorks() {
  return (
    <>
      {/* HERO with video background */}
      <section className="relative max-w-7xl mx-auto px-6 lg:px-12 pt-28 pb-16">
        <FadeIn>
          <p className="section-label mb-6">Technology</p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-[#EDEDED] leading-tight">
            The technology
            <br />
            <span className="text-[#333]">behind SkySearch</span>
          </h1>
        </FadeIn>
        <FadeIn delay={200}>
          <p className="mt-6 text-base text-[#666] max-w-xl leading-relaxed">
            From takeoff to target — how our AI finds anyone, anywhere, autonomously.
          </p>
        </FadeIn>

        {/* Hero video block */}
        <FadeIn delay={400}>
          <div className="mt-12 relative border border-[#1A1A1A] bg-[#0A0A0A] aspect-video overflow-hidden group">
            <video
              autoPlay
              muted
              loop
              playsInline
              className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:opacity-50 transition-opacity duration-700"
            >
              <source src="https://assets.mixkit.co/videos/44690/44690-720.mp4" type="video/mp4" />
            </video>
            {/* Scan line */}
            <div className="absolute left-0 right-0 h-px bg-[#CDFF00]/20 animate-scan z-10" />
            {/* Corner brackets */}
            <div className="absolute top-4 left-4 w-6 h-6 border-t border-l border-[#CDFF00]/20 z-10" />
            <div className="absolute top-4 right-4 w-6 h-6 border-t border-r border-[#CDFF00]/20 z-10" />
            <div className="absolute bottom-12 left-4 w-6 h-6 border-b border-l border-[#CDFF00]/20 z-10" />
            <div className="absolute bottom-12 right-4 w-6 h-6 border-b border-r border-[#CDFF00]/20 z-10" />
            {/* Detection overlays */}
            <div className="absolute top-[30%] left-[15%] w-20 h-28 border border-[#CDFF00]/40 border-dashed z-10">
              <div className="absolute -top-5 left-0 text-[9px] font-mono text-[#CDFF00] bg-[#CDFF00]/10 px-1.5 py-0.5">
                PERSON · 96%
              </div>
            </div>
            <div className="absolute top-[40%] right-[20%] w-24 h-14 border border-[#F59E0B]/40 border-dashed z-10">
              <div className="absolute -top-5 left-0 text-[9px] font-mono text-[#F59E0B] bg-[#F59E0B]/10 px-1.5 py-0.5">
                VEHICLE · 89%
              </div>
            </div>
            {/* HUD bottom */}
            <div className="absolute bottom-0 left-0 right-0 bg-[#0A0A0A]/90 border-t border-[#1A1A1A] px-4 py-2 flex gap-3 z-10">
              <span className="text-[9px] font-mono text-[#555] border border-[#1A1A1A] px-2 py-0.5">OBJECTS: 14</span>
              <span className="text-[9px] font-mono text-[#CDFF00] border border-[#1A1A1A] px-2 py-0.5">NEURAL NET: ACTIVE</span>
              <span className="text-[9px] font-mono text-[#555] border border-[#1A1A1A] px-2 py-0.5">30 FPS</span>
              <span className="text-[9px] font-mono text-[#555] border border-[#1A1A1A] px-2 py-0.5 ml-auto">99.2% ACCURACY</span>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* TECH SECTIONS with images */}
      <section className="max-w-7xl mx-auto px-6 lg:px-12 py-16 space-y-0">
        {techSections.map((section, i) => (
          <div
            key={section.num}
            className="grid grid-cols-1 lg:grid-cols-2 gap-0 border border-[#1A1A1A] -mt-px"
          >
            {/* Text side */}
            <FadeIn className={`${i % 2 === 1 ? "lg:order-2" : ""}`}>
              <div className="p-8 lg:p-12 flex flex-col justify-center h-full">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-[10px] font-mono tracking-[0.2em] text-[#CDFF00]">
                    {section.tag}
                  </span>
                  <span className="h-px flex-1 bg-[#1A1A1A]" />
                  <span className="font-mono text-sm text-[#2A2A2A]">{section.num}</span>
                </div>
                <h3 className="text-2xl font-semibold text-[#EDEDED] tracking-tight">
                  {section.title}
                </h3>
                <p className="text-sm text-[#666] mt-4 leading-relaxed">{section.desc}</p>
                <ul className="mt-6 space-y-3">
                  {section.bullets.map((b) => (
                    <li key={b} className="flex items-center gap-3 text-sm text-[#888]">
                      <span className="w-1 h-1 bg-[#CDFF00] shrink-0" />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            </FadeIn>
            {/* Image side */}
            <FadeIn delay={200} className={`${i % 2 === 1 ? "lg:order-1" : ""}`}>
              <div className="relative h-64 lg:h-full min-h-[300px] overflow-hidden border-t lg:border-t-0 lg:border-l border-[#1A1A1A]">
                <img
                  src={section.img}
                  alt={section.title}
                  className="absolute inset-0 w-full h-full object-cover opacity-40 hover:opacity-60 transition-opacity duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent" />
                {/* Corner brackets */}
                <div className="absolute top-4 left-4 w-5 h-5 border-t border-l border-[#CDFF00]/20" />
                <div className="absolute top-4 right-4 w-5 h-5 border-t border-r border-[#CDFF00]/20" />
                <div className="absolute bottom-4 left-4 w-5 h-5 border-b border-l border-[#CDFF00]/20" />
                <div className="absolute bottom-4 right-4 w-5 h-5 border-b border-r border-[#CDFF00]/20" />
                {/* Tag */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[9px] font-mono text-[#555] bg-[#0A0A0A]/80 px-3 py-1 border border-[#1A1A1A]">
                  {section.tag} MODULE
                </div>
              </div>
            </FadeIn>
          </div>
        ))}
      </section>

      {/* Architecture diagram */}
      <section className="max-w-7xl mx-auto px-6 lg:px-12 py-24">
        <FadeIn>
          <p className="section-label mb-4">Architecture</p>
          <h2 className="text-2xl sm:text-3xl font-semibold text-[#EDEDED] tracking-tight mb-12">
            System pipeline
          </h2>
        </FadeIn>
        <FadeIn delay={200}>
          <div className="flex flex-col sm:flex-row items-stretch gap-px bg-[#1A1A1A]">
            {[
              { label: "Camera Feed", sub: "30 FPS · 4K", accent: "#555" },
              { label: "Neural Network", sub: "Object Detection", accent: "#CDFF00" },
              { label: "LLM Reasoning", sub: "Claude AI", accent: "#CDFF00" },
              { label: "Flight Control", sub: "DJI SDK", accent: "#555" },
              { label: "Operator", sub: "Alerts & Feed", accent: "#22C55E" },
            ].map((step, i) => (
              <div key={step.label} className="flex-1 bg-[#0A0A0A] p-6 text-center relative group hover:bg-[#0F0F0F] transition-colors">
                <div className="text-[9px] font-mono tracking-wider mb-2" style={{ color: step.accent }}>
                  {String(i + 1).padStart(2, "0")}
                </div>
                <p className="text-xs font-semibold text-[#EDEDED] tracking-wide uppercase">{step.label}</p>
                <p className="text-[10px] text-[#555] mt-1 font-mono">{step.sub}</p>
                {i < 4 && (
                  <div className="hidden sm:block absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 text-[#2A2A2A] text-xs">→</div>
                )}
                <div className="absolute bottom-0 left-0 w-0 group-hover:w-full h-px bg-[#CDFF00]/30 transition-all duration-700" />
              </div>
            ))}
          </div>
        </FadeIn>
      </section>

      {/* DJI GRID with images */}
      <section className="max-w-7xl mx-auto px-6 lg:px-12 py-32">
        <FadeIn>
          <p className="section-label mb-4">Compatibility</p>
          <h2 className="text-2xl sm:text-3xl font-semibold text-[#EDEDED] tracking-tight mb-4">
            Works with every DJI drone
          </h2>
          <p className="text-sm text-[#555] mb-12">
            Connect your existing hardware and start searching in minutes.
          </p>
        </FadeIn>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-px bg-[#1A1A1A]">
          {djiDrones.map((drone, i) => (
            <FadeIn key={drone.name} delay={i * 50}>
              <div className="bg-[#0A0A0A] hover:bg-[#0F0F0F] transition-colors group relative overflow-hidden">
                {drone.img && (
                  <div className="h-24 overflow-hidden">
                    <img
                      src={drone.img}
                      alt={drone.name}
                      className="w-full h-full object-cover opacity-30 group-hover:opacity-50 group-hover:scale-105 transition-all duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0A0A0A]" />
                  </div>
                )}
                <div className="p-5 text-center relative">
                  <p className="text-sm font-medium text-[#EDEDED]">{drone.name}</p>
                  {drone.name !== "50+ More" ? (
                    <p className="text-[9px] text-[#22C55E] font-mono mt-2">READY</p>
                  ) : (
                    <Link href="/connect" className="text-[9px] text-[#888] font-mono mt-2 inline-block hover:text-[#EDEDED] transition-colors">
                      SEE ALL →
                    </Link>
                  )}
                </div>
                <div className="absolute bottom-0 left-0 w-0 group-hover:w-full h-px bg-[#CDFF00]/30 transition-all duration-700" />
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-6 lg:px-12 pb-32">
        <FadeIn>
          <div className="relative border border-[#1A1A1A] overflow-hidden">
            <video
              autoPlay
              muted
              loop
              playsInline
              className="absolute inset-0 w-full h-full object-cover opacity-15"
            >
              <source src="https://assets.mixkit.co/videos/1767/1767-720.mp4" type="video/mp4" />
            </video>
            <div className="relative z-10 p-10 sm:p-14 text-center">
              <div className="absolute inset-0 bg-gradient-to-br from-[#CDFF00]/[0.02] to-transparent" />
              <div className="relative z-10">
                <h3 className="text-xl font-semibold text-[#EDEDED] mb-3">
                  See it in action
                </h3>
                <p className="text-sm text-[#555] mb-8">
                  Try the live control panel and experience AI-powered flight.
                </p>
                <Link
                  href="/control"
                  className="group inline-flex items-center gap-3 px-8 py-4 bg-[#CDFF00] text-[#0A0A0A] text-xs font-semibold tracking-[0.1em] uppercase hover:bg-[#d8ff33] transition-all"
                >
                  <span className="w-1.5 h-1.5 bg-[#0A0A0A] group-hover:scale-150 transition-transform" />
                  Open Control Panel
                </Link>
              </div>
            </div>
          </div>
        </FadeIn>
      </section>
    </>
  );
}
