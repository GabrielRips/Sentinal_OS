"use client";

import Link from "next/link";
import FadeIn from "@/components/FadeIn";

const sports = [
  { name: "SOCCER", desc: "Auto-track ball and flow of play", img: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400&q=80" },
  { name: "BASKETBALL", desc: "Court-aware player tracking", img: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&q=80" },
  { name: "FOOTBALL", desc: "Wide-angle formation tracking", img: "https://images.unsplash.com/photo-1508098682722-e99c643e7f76?w=400&q=80" },
  { name: "TENNIS", desc: "Rally tracking with zoom", img: "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=400&q=80" },
  { name: "BASEBALL", desc: "Diamond coverage mode", img: "https://images.unsplash.com/photo-1529768167801-9173d94c2a42?w=400&q=80" },
  { name: "TRACK & FIELD", desc: "Multi-athlete tracking", img: "https://images.unsplash.com/photo-1461896836934-bd45ba4d8e97?w=400&q=80" },
];

const filmingSteps = [
  { num: "01", title: "SELECT SPORT", desc: "Pick sport type and define field boundaries" },
  { num: "02", title: "LAUNCH DRONE", desc: "AI handles takeoff, positioning, and tracking" },
  { num: "03", title: "DOWNLOAD FOOTAGE", desc: "Cinema-quality MP4 with AI-generated highlights" },
];

const features = [
  "Ball tracking across entire field",
  "Player identification and following",
  "Automatic highlight detection",
  "Smooth cinematic camera movements",
  "Obstacle avoidance around structures",
  "All weather, day or night operation",
];

export default function SportsPage() {
  return (
    <>
      {/* HERO with video */}
      <section className="relative max-w-7xl mx-auto px-6 lg:px-12 pt-28 pb-16">
        <FadeIn>
          <p className="section-label mb-6">Autonomous Filming</p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-[#EDEDED] leading-tight">
            Film any game.
            <br />
            <span className="text-[#333]">No pilot needed.</span>
          </h1>
        </FadeIn>
        <FadeIn delay={200}>
          <p className="mt-6 text-base text-[#666] max-w-xl leading-relaxed">
            Broadcast-quality autonomous sports footage powered by AI tracking.
            Press play and let SkySearch handle the rest.
          </p>
        </FadeIn>

        {/* Hero video */}
        <FadeIn delay={400}>
          <div className="mt-12 relative border border-[#1A1A1A] bg-[#0A0A0A] aspect-video overflow-hidden group">
            <video
              autoPlay
              muted
              loop
              playsInline
              className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:opacity-50 transition-opacity duration-700"
              poster="https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1920&q=80"
            >
              <source src="https://assets.mixkit.co/videos/17398/17398-720.mp4" type="video/mp4" />
            </video>
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <div className="text-center">
                <div className="w-14 h-14 border border-white/20 flex items-center justify-center mx-auto mb-4 hover:border-[#CDFF00]/50 hover:bg-[#CDFF00]/5 transition-all cursor-pointer group/play">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 text-white/80 ml-0.5 group-hover/play:text-[#CDFF00] transition-colors" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
                <p className="text-[#555] text-xs tracking-wider uppercase">Watch autonomous filming</p>
              </div>
            </div>
            {/* HUD overlay */}
            <div className="absolute top-4 left-4 w-6 h-6 border-t border-l border-[#CDFF00]/20 z-10" />
            <div className="absolute top-4 right-4 w-6 h-6 border-t border-r border-[#CDFF00]/20 z-10" />
            <div className="absolute bottom-12 left-4 w-6 h-6 border-b border-l border-[#CDFF00]/20 z-10" />
            <div className="absolute bottom-12 right-4 w-6 h-6 border-b border-r border-[#CDFF00]/20 z-10" />
            <div className="absolute bottom-0 left-0 right-0 bg-[#0A0A0A]/90 border-t border-[#1A1A1A] px-4 py-2 flex gap-3 z-10">
              <span className="text-[9px] font-mono text-[#555] border border-[#1A1A1A] px-2 py-0.5">TRACKING: 22 PLAYERS</span>
              <span className="text-[9px] font-mono text-[#CDFF00] border border-[#1A1A1A] px-2 py-0.5">AI: ACTIVE</span>
              <span className="text-[9px] font-mono text-[#555] border border-[#1A1A1A] px-2 py-0.5">4K 60FPS</span>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* SPORTS GRID with images */}
      <section className="max-w-7xl mx-auto px-6 lg:px-12 py-32">
        <FadeIn>
          <p className="section-label mb-4">Supported Sports</p>
          <h2 className="text-2xl sm:text-3xl font-semibold text-[#EDEDED] tracking-tight mb-12">
            Six sport modes
          </h2>
        </FadeIn>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-[#1A1A1A]">
          {sports.map((sport, i) => (
            <FadeIn key={sport.name} delay={i * 80}>
              <div className="bg-[#0A0A0A] group hover:bg-[#0F0F0F] transition-colors overflow-hidden relative">
                <div className="h-32 overflow-hidden">
                  <img
                    src={sport.img}
                    alt={sport.name}
                    className="w-full h-full object-cover opacity-40 group-hover:opacity-60 group-hover:scale-105 transition-all duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0A0A0A]" />
                </div>
                <div className="p-6 relative">
                  <h3 className="text-xs font-semibold text-[#EDEDED] tracking-[0.15em]">{sport.name}</h3>
                  <p className="text-xs text-[#555] mt-2">{sport.desc}</p>
                </div>
                <div className="absolute bottom-0 left-0 h-px w-0 group-hover:w-full bg-[#CDFF00]/30 transition-all duration-700" />
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="max-w-7xl mx-auto px-6 lg:px-12 py-16">
        <FadeIn>
          <p className="section-label mb-4">Process</p>
          <h2 className="text-2xl sm:text-3xl font-semibold text-[#EDEDED] tracking-tight mb-12">
            How autonomous filming works
          </h2>
        </FadeIn>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-[#1A1A1A]">
          {filmingSteps.map((step, i) => (
            <FadeIn key={step.num} delay={i * 120}>
              <div className="bg-[#0A0A0A] p-8 group hover:bg-[#0F0F0F] transition-colors relative overflow-hidden">
                <span className="font-mono text-3xl font-light text-[#1A1A1A] group-hover:text-[#CDFF00]/10 transition-colors block mb-4">
                  {step.num}
                </span>
                <h3 className="text-xs font-semibold text-[#EDEDED] tracking-[0.15em]">{step.title}</h3>
                <p className="text-xs text-[#555] mt-3">{step.desc}</p>
                <div className="absolute top-0 left-0 w-0 group-hover:w-full h-px bg-[#CDFF00]/20 transition-all duration-700" />
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* KEY FEATURES */}
      <section className="max-w-7xl mx-auto px-6 lg:px-12 py-32">
        <FadeIn>
          <p className="section-label mb-4">Features</p>
          <h2 className="text-2xl sm:text-3xl font-semibold text-[#EDEDED] tracking-tight mb-12">
            Key capabilities
          </h2>
        </FadeIn>

        <div className="max-w-lg border-t border-[#1A1A1A]">
          {features.map((feature, i) => (
            <FadeIn key={feature} delay={i * 60}>
              <div className="flex items-center gap-4 py-4 border-b border-[#1A1A1A] group hover:bg-[#0F0F0F] px-2 -mx-2 transition-colors">
                <span className="w-1 h-1 bg-[#CDFF00] shrink-0 group-hover:scale-150 transition-transform" />
                <span className="text-sm text-[#888] group-hover:text-[#EDEDED] transition-colors">{feature}</span>
              </div>
            </FadeIn>
          ))}
        </div>

        {/* CTA */}
        <FadeIn delay={500}>
          <div className="mt-16 border border-[#1A1A1A] p-10 sm:p-14 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#CDFF00]/[0.02] to-transparent" />
            <div className="relative z-10">
              <h3 className="text-xl font-semibold text-[#EDEDED] mb-6">
                Ready to film your next game?
              </h3>
              <Link
                href="/connect"
                className="group inline-flex items-center gap-3 px-8 py-4 bg-[#CDFF00] text-[#0A0A0A] text-xs font-semibold tracking-[0.1em] uppercase hover:bg-[#d8ff33] transition-all"
              >
                <span className="w-1.5 h-1.5 bg-[#0A0A0A] group-hover:scale-150 transition-transform" />
                Connect Your Drone
              </Link>
            </div>
          </div>
        </FadeIn>
      </section>
    </>
  );
}
