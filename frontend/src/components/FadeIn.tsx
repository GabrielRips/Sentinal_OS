"use client";

import { useEffect, useRef, useState } from "react";

type Direction = "up" | "down" | "left" | "right" | "none";

export default function FadeIn({
  children,
  delay = 0,
  duration = 700,
  direction = "up",
  distance = 40,
  scale = false,
  className = "",
  once = true,
  threshold = 0.15,
}: {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  direction?: Direction;
  distance?: number;
  scale?: boolean;
  className?: string;
  once?: boolean;
  threshold?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setVisible(false);
        }
      },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [once, threshold]);

  const getTransform = (show: boolean) => {
    if (show) return scale ? "translate(0,0) scale(1)" : "translate(0,0)";
    const d = distance;
    const dirs: Record<Direction, string> = {
      up: `translate(0, ${d}px)`,
      down: `translate(0, -${d}px)`,
      left: `translate(${d}px, 0)`,
      right: `translate(-${d}px, 0)`,
      none: "translate(0,0)",
    };
    return scale ? `${dirs[direction]} scale(0.95)` : dirs[direction];
  };

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: getTransform(visible),
        transition: `opacity ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
        willChange: "opacity, transform",
      }}
    >
      {children}
    </div>
  );
}
