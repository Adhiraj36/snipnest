"use client";

import Link from "next/link";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import {
  Sparkles,
  Code2,
  CheckCircle2,
  Zap,
  BookOpen,
  Trophy,
  Bell,
  Layers,
} from "lucide-react";
import { FloatingCard } from "./floating-card";

export function Hero() {
  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20"
    >
      {/* Subtle background pattern */}
      <div className="pattern-overlay absolute inset-0" aria-hidden="true" />

      {/* Decorative gradient orbs */}
      <div
        className="absolute top-20 left-1/4 w-96 h-96 rounded-full
                    bg-orange-500/10 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-20 right-1/4 w-80 h-80 rounded-full
                    bg-amber-500/8 blur-3xl"
        aria-hidden="true"
      />

      {/* ─── Floating UI cards ─────────────────────────────────────────── */}

      {/* Task card — top-left */}
      <FloatingCard
        className="hidden lg:flex absolute top-36 left-[8%] xl:left-[12%] flex-col gap-2.5 w-56 animate-fade-in"
        speed="slow"
        delay="0.3s"
      >
        <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-text)]">
          <Code2 className="h-4 w-4 text-orange-500" />
          Current Task
        </div>
        <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
          Build a recursive Fibonacci function with memoization
        </p>
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
          <span className="text-[10px] font-medium text-orange-400">
            In Progress
          </span>
        </div>
      </FloatingCard>

      {/* Reminder card — top-right */}
      <FloatingCard
        className="hidden lg:flex absolute top-44 right-[8%] xl:right-[12%] flex-col gap-2 w-52 animate-fade-in"
        speed="fast"
        delay="0.5s"
      >
        <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-text)]">
          <Bell className="h-4 w-4 text-amber-500" />
          Reminder
        </div>
        <p className="text-xs text-[var(--color-text-muted)]">
          3 new topics unlocked in Python
        </p>
        <div className="text-[10px] text-[var(--color-text-muted)]">2 min ago</div>
      </FloatingCard>

      {/* Integration icons — bottom-left */}
      <FloatingCard
        className="hidden lg:flex absolute bottom-36 left-[6%] xl:left-[10%] items-center gap-3 animate-fade-in"
        delay="0.7s"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-900/30">
          <Layers className="h-4 w-4 text-orange-400" />
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-900/30">
          <BookOpen className="h-4 w-4 text-amber-400" />
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-yellow-900/30">
          <Zap className="h-4 w-4 text-yellow-400" />
        </div>
      </FloatingCard>

      {/* Sticky note — bottom-right */}
      <FloatingCard
        className="hidden lg:flex absolute bottom-40 right-[6%] xl:right-[10%] flex-col gap-2 w-48
                   !bg-orange-950/30 !border-orange-500/20 animate-fade-in"
        speed="slow"
        delay="0.9s"
      >
        <div className="flex items-center gap-2 text-xs font-semibold text-orange-400">
          <Trophy className="h-4 w-4" />
          Achievement
        </div>
        <p className="text-xs text-orange-300/80 leading-relaxed">
          🎉 Perfect score on 3 sessions in a row!
        </p>
      </FloatingCard>

      {/* ─── Hero content ──────────────────────────────────────────────── */}
      <div className="relative z-10 mx-auto max-w-3xl px-5 text-center">
        {/* Badge */}
        <div
          className="inline-flex items-center gap-2 rounded-full px-4 py-1.5
                      border border-[var(--color-border)] bg-[var(--color-bg-card)]
                      shadow-[var(--shadow-sm)] text-xs font-medium text-[var(--color-text-muted)]
                      animate-fade-in mb-8"
        >
          <Sparkles className="h-3.5 w-3.5 text-orange-500" />
          AI-Powered Coding Mentor
        </div>

        {/* Headline */}
        <h1
          className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-[1.1] tracking-tight
                     text-[var(--color-text)] animate-fade-in-up"
          style={{ animationDelay: "0.1s" }}
        >
          Master Code Through
          <span
            className="block bg-gradient-to-r from-orange-400 to-orange-600
                       bg-clip-text text-transparent"
          >
            Guided Practice
          </span>
        </h1>

        {/* Subtitle */}
        <p
          className="mx-auto mt-6 max-w-xl text-base sm:text-lg text-[var(--color-text-muted)]
                     leading-relaxed animate-fade-in-up"
          style={{ animationDelay: "0.2s" }}
        >
          Choose a topic, learn theory, solve AI-generated challenges in-browser,
          and level up with real-time feedback from your personal AI mentor.
        </p>

        {/* CTA buttons */}
        <div
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4
                     animate-fade-in-up"
          style={{ animationDelay: "0.35s" }}
        >
          <SignedOut>
            <Link
              href="/sign-in"
              className="inline-flex items-center gap-2 px-7 py-3.5 text-sm font-semibold
                         rounded-2xl text-white bg-gradient-to-r from-orange-500 to-orange-600
                         shadow-[0_4px_24px_rgba(249,115,22,0.3)] transition-all duration-200
                         hover:shadow-[0_8px_32px_rgba(249,115,22,0.45)] hover:-translate-y-0.5
                         active:translate-y-0"
            >
              Get Started
              <Sparkles className="h-4 w-4" />
            </Link>
            <a
              href="#features"
              className="inline-flex items-center gap-2 px-7 py-3.5 text-sm font-semibold
                         rounded-2xl border border-[var(--color-border)]
                         text-[var(--color-text)] bg-[var(--color-bg-card)]
                         shadow-[var(--shadow-sm)] transition-all duration-200
                         hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5"
            >
              Live Demo
            </a>
          </SignedOut>
          <SignedIn>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-7 py-3.5 text-sm font-semibold
                         rounded-2xl text-white bg-gradient-to-r from-orange-500 to-orange-600
                         shadow-[0_4px_24px_rgba(249,115,22,0.3)] transition-all duration-200
                         hover:shadow-[0_8px_32px_rgba(249,115,22,0.45)] hover:-translate-y-0.5
                         active:translate-y-0"
            >
              Go to Dashboard
              <Sparkles className="h-4 w-4" />
            </Link>
          </SignedIn>
        </div>

        {/* Trust indicators */}
        <div
          className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs
                     text-[var(--color-text-muted)] animate-fade-in-up"
          style={{ animationDelay: "0.5s" }}
        >
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-orange-500" />
            Free to start
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-orange-500" />
            AI-powered feedback
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-orange-500" />
            50+ coding topics
          </span>
        </div>
      </div>
    </section>
  );
}
