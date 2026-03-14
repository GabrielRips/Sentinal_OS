"use client";

import Link from "next/link";
import { useState } from "react";

const links = [
  { href: "/how-it-works", label: "Technology" },
  { href: "/sports", label: "Sports" },
  { href: "/live-feed", label: "Live Feed" },
  { href: "/connect", label: "Connect" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-6 lg:px-12 bg-[#0A0A0A]/90 backdrop-blur-md border-b border-[#1A1A1A]">
      <Link href="/" className="flex items-center gap-3">
        <div className="w-6 h-6 border border-[#EDEDED] flex items-center justify-center">
          <div className="w-2 h-2 bg-[#CDFF00]" />
        </div>
        <span className="text-sm font-medium tracking-[0.2em] text-[#EDEDED] uppercase">
          SkySearch
        </span>
      </Link>

      {/* Desktop */}
      <div className="hidden md:flex items-center gap-10">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-xs tracking-[0.1em] uppercase text-[#888] hover:text-[#EDEDED] transition-colors duration-200"
          >
            {link.label}
          </Link>
        ))}
        <Link
          href="/control"
          className="text-xs tracking-[0.1em] uppercase text-[#0A0A0A] bg-[#EDEDED] hover:bg-white px-5 py-2 transition-colors duration-200"
        >
          Control Panel
        </Link>
      </div>

      {/* Mobile hamburger */}
      <button
        onClick={() => setOpen(!open)}
        className="md:hidden text-[#EDEDED] p-2"
        aria-label="Menu"
      >
        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5">
          {open ? (
            <path d="M4 4l12 12M4 16L16 4" />
          ) : (
            <path d="M2 5h16M2 10h16M2 15h16" />
          )}
        </svg>
      </button>

      {/* Mobile menu */}
      {open && (
        <div className="absolute top-14 left-0 right-0 bg-[#0A0A0A] border-b border-[#1A1A1A] p-6 md:hidden">
          <div className="flex flex-col gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="text-xs tracking-[0.1em] uppercase text-[#888] hover:text-[#EDEDED] transition-colors py-3 border-b border-[#1A1A1A]"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/control"
              onClick={() => setOpen(false)}
              className="text-xs tracking-[0.1em] uppercase text-center text-[#0A0A0A] bg-[#EDEDED] px-5 py-3 mt-4"
            >
              Control Panel
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
