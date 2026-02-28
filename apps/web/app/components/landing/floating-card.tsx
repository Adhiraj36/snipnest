"use client";

import type { ReactNode } from "react";

interface FloatingCardProps {
  children: ReactNode;
  className?: string;
  /** Animation delay in CSS format, e.g. "0.2s" */
  delay?: string;
  /** Animation speed: "slow" | "normal" | "fast" */
  speed?: "slow" | "normal" | "fast";
}

const speedClass = {
  slow: "animate-float-slow",
  normal: "animate-float",
  fast: "animate-float-fast",
} as const;

export function FloatingCard({
  children,
  className = "",
  delay = "0s",
  speed = "normal",
}: FloatingCardProps) {
  return (
    <div
      className={`glass rounded-2xl shadow-[var(--shadow-lg)] p-4
                  ${speedClass[speed]} ${className}`}
      style={{ animationDelay: delay }}
    >
      {children}
    </div>
  );
}
