"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import FadeIn from "@/components/FadeIn";
import AnimatedCounter from "@/components/AnimatedCounter";

/* ════════════════════════════════════════════
   DATA
   ════════════════════════════════════════════ */

const capabilities = [
  {
    title: "Computer Vision",
    desc: "Real-time object detection and facial recognition at 30fps. Onboard neural network processing with 99.2% accuracy across all lighting conditions.",
    tag: "PERCEPTION",
    img: "https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=600&q=80",
  },
  {
    title: "Natural Language Control",
    desc: "Plain English commands translated to precise flight maneuvers. Speak or type — the LLM handles decomposition, planning, and execution.",
    tag: "COMMAND",
    img: "https://images.unsplash.com/photo-1527977966376-1c8408f9f108?w=600&q=80",
  },
  {
    title: "Autonomous Navigation",
    desc: "Grid search patterns, obstacle avoidance, and battery-aware routing. Set a mission objective and the drone handles the rest.",
    tag: "AUTONOMY",
    img: "https://images.unsplash.com/photo-1508444845599-5c89863b1c44?w=600&q=80",
  },
  {
    title: "Sports Filming",
    desc: "Broadcast-quality autonomous footage. AI tracks players, ball, and action across 6+ sport types without a pilot.",
    tag: "FILMING",
    img: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600&q=80",
  },
  {
    title: "Real-Time Alerts",
    desc: "Instant notification when targets are detected — push, voice, SMS. Photo, location, and confidence score delivered in under 2 seconds.",
    tag: "ALERTS",
    img: "https://images.unsplash.com/photo-1579829366248-204fe8413f31?w=600&q=80",
  },
  {
    title: "LLM Reasoning",
    desc: "Not just commands — conversations. The drone understands context, asks clarifications, and reports findings with spatial reasoning.",
    tag: "INTELLIGENCE",
    img: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=600&q=80",
  },
];

const steps = [
  { num: "01", title: "Connect", desc: "Pair any DJI drone over Wi-Fi. 60-second setup, zero configuration." },
  { num: "02", title: "Command", desc: "Speak or type a mission objective in plain English. The LLM plans the rest." },
  { num: "03", title: "Search", desc: "Autonomous flight with real-time AI scanning. Full area coverage, obstacle avoidance." },
  { num: "04", title: "Find", desc: "Instant alert with high-res capture, GPS coordinates, and confidence score." },
];

const logos = ["DJI MINI", "DJI AIR", "DJI MAVIC", "DJI AVATA", "DJI MATRICE", "DJI INSPIRE", "DJI PHANTOM", "50+ MODELS"];

/* ════════════════════════════════════════════
   COMPONENTS
   ════════════════════════════════════════════ */

function RotatingWord({ words }: { words: string[] }) {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % words.length);
        setVisible(true);
      }, 300);
    }, 3000);
    return () => clearInterval(interval);
  }, [words.length]);

  return (
    <span
      className="text-[#CDFF00] inline-block transition-all duration-300"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(8px)",
      }}
    >
      {words[index]}
    </span>
  );
}

function ParallaxImage({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onScroll = () => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const speed = 0.15;
      const y = (rect.top - window.innerHeight / 2) * speed;
      const img = ref.current.querySelector("img");
      if (img) img.style.transform = `translateY(${y}px) scale(1.1)`;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div ref={ref} className={`overflow-hidden ${className}`}>
      <img src={src} alt={alt} className="w-full h-full object-cover transition-transform duration-100" />
    </div>
  );
}

/* ════════════════════════════════════════════
   PAGE
   ════════════════════════════════════════════ */

export default function Home() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2,
      });
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <div>
      {/* ═══ HERO — Video background ═══ */}
      <section className="relative min-h-screen flex flex-col justify-center overflow-hidden">
        {/* Video background */}
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          poster="https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1920&q=80"
        >
          <source src="https://assets.mixkit.co/videos/44690/44690-720.mp4" type="video/mp4" />
        </video>

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0A]/70 via-[#0A0A0A]/40 to-[#0A0A0A] z-[1]" />

        {/* Grain */}
        <div className="grain absolute inset-0 z-[2] pointer-events-none" />

        {/* Scan line effect */}
        <div className="absolute inset-0 z-[3] pointer-events-none overflow-hidden">
          <div className="absolute left-0 right-0 h-px bg-[#CDFF00]/10 animate-scan" />
        </div>

        {/* Corner brackets */}
        <div className="absolute top-20 left-6 lg:left-12 w-12 h-12 border-t border-l border-white/10 z-[4]" />
        <div className="absolute top-20 right-6 lg:right-12 w-12 h-12 border-t border-r border-white/10 z-[4]" />
        <div className="absolute bottom-20 left-6 lg:left-12 w-12 h-12 border-b border-l border-white/10 z-[4]" />
        <div className="absolute bottom-20 right-6 lg:right-12 w-12 h-12 border-b border-r border-white/10 z-[4]" />

        {/* Content */}
        <div
          className="relative z-10 px-6 lg:px-12 max-w-5xl"
          style={{
            transform: `translate(${mousePos.x * 3}px, ${mousePos.y * 3}px)`,
            transition: "transform 0.3s ease-out",
          }}
        >
          <FadeIn delay={0} duration={600} distance={20}>
            <div className="flex items-center gap-3 mb-8">
              <span className="w-2 h-2 bg-[#CDFF00] animate-pulse-dot" />
              <p className="text-[10px] font-mono tracking-[0.3em] uppercase text-[#888]">
                Autonomous Drone Intelligence
              </p>
            </div>
          </FadeIn>

          <FadeIn delay={200} duration={800} distance={30}>
            <h1 className="text-[clamp(2.5rem,7vw,6.5rem)] font-semibold tracking-tight leading-[0.92] text-white">
              Search smarter.
              <br />
              <span className="text-white/15">Not harder.</span>
            </h1>
          </FadeIn>

          <FadeIn delay={500} duration={600} distance={20}>
            <p className="mt-8 text-base sm:text-lg text-[#999] max-w-lg leading-relaxed">
              AI-powered drones that{" "}
              <RotatingWord words={["find missing people", "detect objects instantly", "film sports autonomously", "respond to voice commands"]} />
            </p>
          </FadeIn>

          <FadeIn delay={700} duration={600}>
            <div className="mt-12 flex flex-col sm:flex-row gap-4">
              <Link
                href="/control"
                className="group inline-flex items-center justify-center gap-3 px-8 py-4 bg-[#CDFF00] text-[#0A0A0A] text-xs font-semibold tracking-[0.1em] uppercase hover:bg-[#d8ff33] transition-all duration-300"
              >
                <span className="w-1.5 h-1.5 bg-[#0A0A0A] group-hover:scale-150 transition-transform" />
                Launch Control Panel
              </Link>
              <Link
                href="/how-it-works"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-white/20 text-white/80 text-xs font-medium tracking-[0.1em] uppercase hover:border-white/40 hover:text-white transition-all duration-300 backdrop-blur-sm"
              >
                How It Works
              </Link>
            </div>
          </FadeIn>
        </div>

        {/* HUD telemetry overlay */}
        <div className="absolute bottom-8 left-6 lg:left-12 z-10 flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-px h-8 bg-white/10" />
            <div className="text-[8px] font-mono text-white/30 tracking-widest space-y-1">
              <div>48.85°N 2.35°E</div>
              <div>ALT 120M</div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 right-6 lg:right-12 z-10">
          <span className="text-[8px] font-mono tracking-[0.3em] uppercase text-white/20">Scroll to explore</span>
        </div>
      </section>

      {/* ═══ LOGO TICKER ═══ */}
      <section className="border-y border-[#1A1A1A] py-5 overflow-hidden">
        <div className="flex animate-ticker whitespace-nowrap">
          {[...logos, ...logos].map((p, i) => (
            <span
              key={i}
              className="mx-12 text-[10px] tracking-[0.2em] text-[#333] uppercase font-mono"
            >
              {p}
            </span>
          ))}
        </div>
      </section>

      {/* ═══ CAPABILITIES ═══ */}
      <section className="max-w-7xl mx-auto px-6 lg:px-12 py-32">
        <div className="max-w-xl mb-20">
          <FadeIn>
            <p className="section-label mb-4">Capabilities</p>
          </FadeIn>
          <FadeIn delay={100}>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#EDEDED] tracking-tight leading-tight">
              Everything you need
              <br />
              <span className="text-[#333]">in one system.</span>
            </h2>
          </FadeIn>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-[#1A1A1A]">
          {capabilities.map((c, i) => (
            <FadeIn key={c.title} delay={i * 80} duration={500}>
              <div className="bg-[#0A0A0A] group hover:bg-[#0F0F0F] transition-colors duration-500 overflow-hidden relative">
                {/* Card image */}
                <div className="h-40 overflow-hidden relative">
                  <img
                    src={c.img}
                    alt={c.title}
                    className="w-full h-full object-cover opacity-40 group-hover:opacity-60 group-hover:scale-105 transition-all duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0A0A0A]" />
                  <p className="absolute top-4 left-4 text-[9px] font-mono tracking-[0.2em] text-[#CDFF00]">
                    {c.tag}
                  </p>
                </div>
                {/* Card content */}
                <div className="p-6 lg:p-8">
                  <h3 className="text-base font-semibold text-[#EDEDED] mb-3 group-hover:text-white transition-colors">
                    {c.title}
                  </h3>
                  <p className="text-sm text-[#666] leading-relaxed">
                    {c.desc}
                  </p>
                </div>
                {/* Hover accent line */}
                <div className="absolute bottom-0 left-0 h-px w-0 group-hover:w-full bg-[#CDFF00] transition-all duration-700" />
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ═══ FULL WIDTH DRONE IMAGE ═══ */}
      <section className="relative h-[50vh] overflow-hidden">
        <ParallaxImage
          src="https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=1920&q=80"
          alt="Aerial drone view"
          className="absolute inset-0"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0A] via-transparent to-[#0A0A0A]" />
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <FadeIn>
            <p className="text-[clamp(1.5rem,4vw,3rem)] font-semibold text-white/90 tracking-tight text-center px-6">
              See what your drone sees.
            </p>
          </FadeIn>
        </div>
        {/* Corner HUD */}
        <div className="absolute top-6 left-6 w-8 h-8 border-t border-l border-[#CDFF00]/30 z-10" />
        <div className="absolute top-6 right-6 w-8 h-8 border-t border-r border-[#CDFF00]/30 z-10" />
        <div className="absolute bottom-6 left-6 w-8 h-8 border-b border-l border-[#CDFF00]/30 z-10" />
        <div className="absolute bottom-6 right-6 w-8 h-8 border-b border-r border-[#CDFF00]/30 z-10" />
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section className="py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <FadeIn>
            <div className="mb-20">
              <p className="section-label mb-4">Process</p>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#EDEDED] tracking-tight">
                Four steps to
                <br />
                <span className="text-[#333]">find anyone.</span>
              </h2>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-[#1A1A1A]">
            {steps.map((step, i) => (
              <FadeIn key={step.num} delay={i * 120} duration={600}>
                <div className="bg-[#0A0A0A] p-8 h-full group hover:bg-[#0F0F0F] transition-colors duration-500 relative overflow-hidden">
                  <span className="font-mono text-5xl font-light text-[#1A1A1A] group-hover:text-[#CDFF00]/10 transition-colors duration-500 block mb-6">
                    {step.num}
                  </span>
                  <h3 className="text-sm font-semibold text-[#EDEDED] uppercase tracking-[0.1em] mb-3">
                    {step.title}
                  </h3>
                  <p className="text-sm text-[#555] leading-relaxed">{step.desc}</p>
                  {/* Animated line on hover */}
                  <div className="absolute top-0 left-0 w-0 group-hover:w-full h-px bg-[#CDFF00]/30 transition-all duration-700" />
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ STATS ═══ */}
      <section className="py-32 border-y border-[#1A1A1A] relative overflow-hidden">
        {/* Background video for stats section */}
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-10"
        >
          <source src="https://assets.mixkit.co/videos/1767/1767-720.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-[#0A0A0A]/80" />

        <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-[#1A1A1A]/50">
            {[
              { end: 99, suffix: ".2%", label: "Recognition Accuracy" },
              { end: 50, suffix: "+", label: "DJI Models" },
              { end: 2, prefix: "<", suffix: "s", label: "Response Time" },
              { end: 24, suffix: "/7", label: "Autonomous Operation" },
            ].map((stat, i) => (
              <FadeIn key={stat.label} delay={i * 100}>
                <div className="bg-[#0A0A0A]/70 backdrop-blur-sm p-10 sm:p-14 group relative overflow-hidden">
                  <div className="text-4xl sm:text-5xl font-light text-[#EDEDED] tracking-tight font-mono">
                    {stat.prefix}
                    <AnimatedCounter end={stat.end} duration={2000} suffix={stat.suffix} />
                  </div>
                  <p className="text-[10px] text-[#555] uppercase tracking-[0.2em] mt-4">
                    {stat.label}
                  </p>
                  {/* Glow on hover */}
                  <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#CDFF00]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ COMMAND CENTER PREVIEW ═══ */}
      <section className="max-w-7xl mx-auto px-6 lg:px-12 py-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          <FadeIn direction="left" distance={40}>
            <div>
              <p className="section-label mb-4">Command Center</p>
              <h2 className="text-3xl sm:text-4xl font-semibold text-[#EDEDED] tracking-tight leading-tight mb-6">
                Your drone,
                <br />
                your language.
              </h2>
              <p className="text-sm text-[#666] leading-relaxed mb-8 max-w-md">
                Type or speak commands in plain English. Watch the live feed. Get instant AI notifications.
                The control panel is where mission control meets conversation.
              </p>
              <div className="space-y-0 border-t border-[#1A1A1A]">
                {["Real-time video with AI detection overlays", "Natural language chat with your drone", "Voice commands with instant response", "Live telemetry and GPS tracking"].map((item) => (
                  <div key={item} className="flex items-center gap-4 py-3.5 border-b border-[#1A1A1A] group/item hover:bg-[#0F0F0F] px-2 -mx-2 transition-colors">
                    <div className="w-1 h-1 bg-[#CDFF00] shrink-0 group-hover/item:scale-150 transition-transform" />
                    <span className="text-xs text-[#888] group-hover/item:text-[#EDEDED] transition-colors">{item}</span>
                  </div>
                ))}
              </div>
              <Link
                href="/control"
                className="group inline-flex items-center gap-3 mt-8 px-8 py-4 bg-[#EDEDED] text-[#0A0A0A] text-xs font-semibold tracking-[0.1em] uppercase hover:bg-white transition-colors"
              >
                Open Control Panel
                <svg className="w-3 h-3 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </FadeIn>

          {/* Simulated control panel preview */}
          <FadeIn direction="right" distance={40} delay={200}>
            <div className="border border-[#1A1A1A] bg-[#0F0F0F] relative overflow-hidden group">
              {/* Mini video feed */}
              <div className="relative aspect-video bg-[#0A0A0A] border-b border-[#1A1A1A] overflow-hidden">
                <video
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:opacity-50 transition-opacity duration-500"
                >
                  <source src="https://assets.mixkit.co/videos/506/506-720.mp4" type="video/mp4" />
                </video>

                <div className="absolute top-3 left-3 w-6 h-6 border-t border-l border-[#CDFF00]/30" />
                <div className="absolute top-3 right-3 w-6 h-6 border-t border-r border-[#CDFF00]/30" />
                <div className="absolute bottom-10 left-3 w-6 h-6 border-b border-l border-[#CDFF00]/30" />
                <div className="absolute bottom-10 right-3 w-6 h-6 border-b border-r border-[#CDFF00]/30" />

                <div className="absolute top-[28%] left-[22%] w-16 h-20 border border-[#CDFF00]/60 border-dashed" />
                <div className="absolute top-[26%] left-[22%] text-[8px] font-mono text-[#CDFF00] bg-[#CDFF00]/10 px-1">
                  PERSON 94%
                </div>

                {/* Scan line */}
                <div className="absolute left-0 right-0 h-px bg-[#CDFF00]/15 animate-scan" />

                <div className="absolute bottom-0 left-0 right-0 bg-[#0A0A0A]/90 border-t border-[#1A1A1A] px-3 py-1.5 flex gap-6">
                  <span className="text-[9px] font-mono text-[#555]">ALT 45m</span>
                  <span className="text-[9px] font-mono text-[#555]">SPD 12km/h</span>
                  <span className="text-[9px] font-mono text-[#CDFF00] ml-auto">AI: ACTIVE</span>
                </div>
              </div>

              {/* Mini chat */}
              <div className="p-3 space-y-2">
                <div className="bg-[#0A0A0A] border-l-2 border-[#2A2A2A] p-2.5 max-w-[80%]">
                  <p className="text-[10px] text-[#888]">Person detected in sector 4. 94% match. Moving closer.</p>
                </div>
                <div className="bg-[#0A0A0A] border-l-2 border-[#555] p-2.5 max-w-[60%] ml-auto">
                  <p className="text-[10px] text-[#888]">Take a photo</p>
                </div>
                <div className="flex gap-1.5 mt-1">
                  <div className="flex-1 h-7 bg-[#0A0A0A] border border-[#1A1A1A]" />
                  <div className="w-7 h-7 bg-[#EDEDED]" />
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ═══ CTA — with video bg ═══ */}
      <section className="relative py-40 overflow-hidden">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-20"
        >
          <source src="https://assets.mixkit.co/videos/11/11-720.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0A] via-[#0A0A0A]/60 to-[#0A0A0A]" />

        <div className="relative z-10 max-w-4xl mx-auto px-6 lg:px-12 text-center">
          <FadeIn duration={800}>
            <p className="section-label mb-6">Deploy</p>
            <h2 className="text-3xl sm:text-5xl font-semibold text-white tracking-tight mb-4">
              Ready to deploy?
            </h2>
            <p className="text-sm text-[#888] mb-10 max-w-md mx-auto">
              Connect your DJI drone and start your first autonomous search mission in minutes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/connect"
                className="group inline-flex items-center justify-center gap-3 px-10 py-4 bg-[#CDFF00] text-[#0A0A0A] text-xs font-semibold tracking-[0.1em] uppercase hover:bg-[#d8ff33] transition-all duration-300"
              >
                <span className="w-1.5 h-1.5 bg-[#0A0A0A] group-hover:scale-150 transition-transform" />
                Connect Your Drone
              </Link>
              <Link
                href="/control"
                className="inline-flex items-center justify-center px-10 py-4 border border-white/20 text-white/80 text-xs font-medium tracking-[0.1em] uppercase hover:border-white/40 hover:text-white transition-all duration-300"
              >
                Try Demo
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}
