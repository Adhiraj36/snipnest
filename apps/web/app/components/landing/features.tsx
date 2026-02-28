"use client";

import {
  Brain,
  Code2,
  LineChart,
  BookOpen,
  Zap,
  Shield,
} from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI Mentor",
    description:
      "Get personalized guidance from an AI that adapts to your skill level and learning pace.",
    color: "blue",
  },
  {
    icon: Code2,
    title: "In-Browser Editor",
    description:
      "Write, run, and test code directly in a full-featured Monaco editor — no local setup needed.",
    color: "indigo",
  },
  {
    icon: LineChart,
    title: "Progress Tracking",
    description:
      "Earn XP, unlock badges, and track your growth across topics with detailed analytics.",
    color: "emerald",
  },
  {
    icon: BookOpen,
    title: "Structured Curriculum",
    description:
      "Follow curated learning paths that cover theory and hands-on practice for every topic.",
    color: "violet",
  },
  {
    icon: Zap,
    title: "Instant Feedback",
    description:
      "Get real-time code evaluation and hints so you never stay stuck for long.",
    color: "amber",
  },
  {
    icon: Shield,
    title: "Safe Sandbox",
    description:
      "Code executes in secure, isolated environments — experiment freely without risk.",
    color: "rose",
  },
] as const;

const colorMap: Record<string, { bg: string; icon: string }> = {
  blue: {
    bg: "bg-blue-100 dark:bg-blue-900/30",
    icon: "text-blue-600 dark:text-blue-400",
  },
  indigo: {
    bg: "bg-indigo-100 dark:bg-indigo-900/30",
    icon: "text-indigo-600 dark:text-indigo-400",
  },
  emerald: {
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
    icon: "text-emerald-600 dark:text-emerald-400",
  },
  violet: {
    bg: "bg-violet-100 dark:bg-violet-900/30",
    icon: "text-violet-600 dark:text-violet-400",
  },
  amber: {
    bg: "bg-amber-100 dark:bg-amber-900/30",
    icon: "text-amber-600 dark:text-amber-400",
  },
  rose: {
    bg: "bg-rose-100 dark:bg-rose-900/30",
    icon: "text-rose-600 dark:text-rose-400",
  },
};

export function Features() {
  return (
    <section id="features" className="relative py-28 px-5">
      <div className="mx-auto max-w-6xl">
        {/* Section header */}
        <div className="text-center mb-16">
          <span
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5
                        border border-[var(--color-border)] bg-[var(--color-bg-card)]
                        shadow-[var(--shadow-sm)] text-xs font-medium text-[var(--color-text-muted)] mb-4"
          >
            Features
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--color-text)]">
            Everything you need to
            <span className="bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent">
              {" "}level up
            </span>
          </h2>
          <p className="mt-4 mx-auto max-w-xl text-[var(--color-text-muted)]">
            A complete learning platform designed to take you from beginner to
            confident developer with AI-powered practice.
          </p>
        </div>

        {/* Feature grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feat) => {
            const colors = colorMap[feat.color];
            const Icon = feat.icon;
            return (
              <article
                key={feat.title}
                className="group relative rounded-2xl border border-[var(--color-border)]
                           bg-[var(--color-bg-card)] p-7 shadow-[var(--shadow-sm)]
                           transition-all duration-300
                           hover:shadow-[var(--shadow-lg)] hover:-translate-y-1"
              >
                <div
                  className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${colors.bg}
                              transition-transform duration-300 group-hover:scale-110`}
                >
                  <Icon className={`h-5 w-5 ${colors.icon}`} />
                </div>
                <h3 className="text-base font-bold text-[var(--color-text)] mb-2">
                  {feat.title}
                </h3>
                <p className="text-sm leading-relaxed text-[var(--color-text-muted)]">
                  {feat.description}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
