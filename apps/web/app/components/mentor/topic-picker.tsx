"use client";

import { useState, useMemo } from "react";
import type { InterestDomain } from "@repo/shared-types";
import {
  ArrowLeft,
  ArrowRight,
  Code2,
  Sparkles,
  BookOpen,
  Layers,
  Cpu,
  Globe,
  Terminal,
  Braces,
  Database,
  FileCode,
  GraduationCap,
  Hash,
  Gem,
  Zap,
  Shield,
  Binary,
} from "lucide-react";

/* ─── Icon map for interests ──────────────────────────────────────────────── */

const interestIcons: Record<string, React.ReactNode> = {
  javascript: <Braces className="h-7 w-7" />,
  typescript: <FileCode className="h-7 w-7" />,
  python: <Terminal className="h-7 w-7" />,
  cpp: <Cpu className="h-7 w-7" />,
  java: <Code2 className="h-7 w-7" />,
  c: <Binary className="h-7 w-7" />,
  go: <Globe className="h-7 w-7" />,
  rust: <Shield className="h-7 w-7" />,
  ruby: <Gem className="h-7 w-7" />,
  csharp: <Hash className="h-7 w-7" />,
  kotlin: <Zap className="h-7 w-7" />,
  sql: <Database className="h-7 w-7" />,
};

const fallbackIcon = <Code2 className="h-7 w-7" />;

/* ─── Accent colors per index ─────────────────────────────────────────────── */

const accentColors = [
  { bg: "from-orange-500/20 to-orange-600/5", border: "border-orange-500/30", text: "text-orange-400", glow: "shadow-orange-500/10" },
  { bg: "from-amber-500/20 to-amber-600/5", border: "border-amber-500/30", text: "text-amber-400", glow: "shadow-amber-500/10" },
  { bg: "from-yellow-500/20 to-yellow-600/5", border: "border-yellow-500/30", text: "text-yellow-400", glow: "shadow-yellow-500/10" },
  { bg: "from-orange-400/20 to-red-500/5", border: "border-orange-400/30", text: "text-orange-300", glow: "shadow-orange-400/10" },
  { bg: "from-rose-500/20 to-rose-600/5", border: "border-rose-500/30", text: "text-rose-400", glow: "shadow-rose-500/10" },
  { bg: "from-red-500/20 to-red-600/5", border: "border-red-500/30", text: "text-red-400", glow: "shadow-red-500/10" },
  { bg: "from-emerald-500/20 to-emerald-600/5", border: "border-emerald-500/30", text: "text-emerald-400", glow: "shadow-emerald-500/10" },
  { bg: "from-sky-500/20 to-sky-600/5", border: "border-sky-500/30", text: "text-sky-400", glow: "shadow-sky-500/10" },
  { bg: "from-violet-500/20 to-violet-600/5", border: "border-violet-500/30", text: "text-violet-400", glow: "shadow-violet-500/10" },
  { bg: "from-pink-500/20 to-pink-600/5", border: "border-pink-500/30", text: "text-pink-400", glow: "shadow-pink-500/10" },
  { bg: "from-cyan-500/20 to-cyan-600/5", border: "border-cyan-500/30", text: "text-cyan-400", glow: "shadow-cyan-500/10" },
  { bg: "from-lime-500/20 to-lime-600/5", border: "border-lime-500/30", text: "text-lime-400", glow: "shadow-lime-500/10" },
];

function getAccent(i: number) {
  return accentColors[i % accentColors.length];
}

/* ─── Props ───────────────────────────────────────────────────────────────── */

interface TopicPickerProps {
  catalog: InterestDomain[];
  loading: boolean;
  streamPhase: string;
  onStart: (interestId: string, subDomainId: string, topicId: string) => void;
}

/* ─── Component ───────────────────────────────────────────────────────────── */

export function TopicPicker({ catalog, loading, streamPhase, onStart }: TopicPickerProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedInterest, setSelectedInterest] = useState<string>("");
  const [selectedSubDomain, setSelectedSubDomain] = useState<string>("");
  const [selectedTopic, setSelectedTopic] = useState<string>("");

  /* direction for slide animation */
  const [slideDir, setSlideDir] = useState<"right" | "left">("right");

  const interestObj = useMemo(
    () => catalog.find((c) => c.id === selectedInterest),
    [catalog, selectedInterest]
  );
  const subDomainObj = useMemo(
    () => interestObj?.subDomains.find((s) => s.id === selectedSubDomain),
    [interestObj, selectedSubDomain]
  );

  function goForward() {
    setSlideDir("right");
  }
  function goBack() {
    setSlideDir("left");
  }

  function pickInterest(id: string) {
    setSelectedInterest(id);
    const obj = catalog.find((c) => c.id === id);
    setSelectedSubDomain("");
    setSelectedTopic("");
    goForward();
    // Auto-advance if only 1 subdomain
    if (obj && obj.subDomains.length === 1) {
      setSelectedSubDomain(obj.subDomains[0].id);
      setStep(3);
    } else {
      setStep(2);
    }
  }

  function pickSubDomain(id: string) {
    setSelectedSubDomain(id);
    setSelectedTopic("");
    goForward();
    setStep(3);
  }

  function backToStep(target: 1 | 2) {
    goBack();
    if (target === 1) {
      setSelectedInterest("");
      setSelectedSubDomain("");
      setSelectedTopic("");
    } else {
      setSelectedSubDomain("");
      setSelectedTopic("");
    }
    setStep(target);
  }

  function handleStart() {
    if (!selectedInterest || !selectedSubDomain || !selectedTopic) return;
    onStart(selectedInterest, selectedSubDomain, selectedTopic);
  }

  /* ─── Step indicator ────────────────────────────────────────────── */
  const steps = [
    { num: 1, label: "Interest" },
    { num: 2, label: "Sub-domain" },
    { num: 3, label: "Topic" },
  ];

  return (
    <div className="flex-1 flex items-center justify-center p-6 overflow-hidden">
      <div className="w-full max-w-4xl">
        {/* ── Header ─────────────────────────────────────────── */}
        <div className="text-center mb-10 animate-fade-in">
          <div
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-5
                        glass border border-[var(--color-border)] text-xs font-medium text-[var(--color-text-muted)]"
          >
            <GraduationCap className="h-3.5 w-3.5 text-orange-500" />
            New Learning Session
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-text)] tracking-tight">
            {step === 1 && "What do you want to learn?"}
            {step === 2 && (
              <>
                Pick a focus area in{" "}
                <span className="bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
                  {interestObj?.name}
                </span>
              </>
            )}
            {step === 3 && (
              <>
                Choose a topic in{" "}
                <span className="bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
                  {subDomainObj?.name}
                </span>
              </>
            )}
          </h2>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            {step === 1 && "Select a programming language or domain to get started."}
            {step === 2 && "Narrow down to a specific area you want to practice."}
            {step === 3 && "Pick the exact topic — we'll generate theory + coding challenges."}
          </p>
        </div>

        {/* ── Step indicator ─────────────────────────────────── */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={s.num} className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (s.num < step) backToStep(s.num as 1 | 2);
                }}
                disabled={s.num > step}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 cursor-pointer
                  ${
                    s.num === step
                      ? "bg-orange-500/20 text-orange-400 border border-orange-500/40"
                      : s.num < step
                        ? "bg-orange-500/10 text-orange-400/70 border border-orange-500/20 hover:bg-orange-500/15"
                        : "text-[var(--color-text-muted)] border border-[var(--color-border)] opacity-50"
                  }`}
              >
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold
                    ${
                      s.num === step
                        ? "bg-orange-500 text-white"
                        : s.num < step
                          ? "bg-orange-500/40 text-orange-200"
                          : "bg-zinc-700 text-zinc-400"
                    }`}
                >
                  {s.num < step ? "✓" : s.num}
                </span>
                <span className="hidden sm:inline">{s.label}</span>
              </button>
              {i < steps.length - 1 && (
                <div
                  className={`w-8 h-px transition-colors duration-300 ${
                    s.num < step ? "bg-orange-500/50" : "bg-[var(--color-border)]"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* ── Step content ───────────────────────────────────── */}
        <div
          key={step}
          className={`${
            slideDir === "right" ? "animate-slide-in-right" : "animate-slide-in-left"
          }`}
        >
          {/* Step 1: Interests */}
          {step === 1 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {catalog.map((interest, i) => {
                const accent = getAccent(i);
                return (
                  <button
                    key={interest.id}
                    onClick={() => pickInterest(interest.id)}
                    className={`group relative glass rounded-2xl p-5 border transition-all duration-200
                               hover:shadow-lg hover:-translate-y-1 cursor-pointer text-left
                               ${accent.border} ${accent.glow}
                               hover:shadow-[var(--shadow-lg)]`}
                  >
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-xl mb-3
                                  bg-gradient-to-br ${accent.bg} ${accent.text}
                                  transition-transform duration-200 group-hover:scale-110`}
                    >
                      {interestIcons[interest.id.toLowerCase()] || fallbackIcon}
                    </div>
                    <h3 className="text-sm font-bold text-[var(--color-text)] mb-1">
                      {interest.name}
                    </h3>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {interest.subDomains.length} area{interest.subDomains.length !== 1 ? "s" : ""} ·{" "}
                      {interest.subDomains.reduce((sum, s) => sum + s.topics.length, 0)} topics
                    </p>
                    <ArrowRight
                      className={`absolute top-5 right-5 h-4 w-4 ${accent.text} opacity-0 group-hover:opacity-100
                                  transition-all duration-200 group-hover:translate-x-0.5`}
                    />
                  </button>
                );
              })}
            </div>
          )}

          {/* Step 2: Sub-domains */}
          {step === 2 && interestObj && (
            <div>
              <button
                onClick={() => backToStep(1)}
                className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] hover:text-orange-400
                           transition-colors mb-5 cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to interests
              </button>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {interestObj.subDomains.map((sub, i) => {
                  const accent = getAccent(i);
                  return (
                    <button
                      key={sub.id}
                      onClick={() => pickSubDomain(sub.id)}
                      className={`group relative glass rounded-2xl p-5 border transition-all duration-200
                                 hover:shadow-lg hover:-translate-y-1 cursor-pointer text-left
                                 ${accent.border} ${accent.glow}
                                 hover:shadow-[var(--shadow-lg)]`}
                    >
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-xl mb-3
                                    bg-gradient-to-br ${accent.bg}`}
                      >
                        <BookOpen className={`h-5 w-5 ${accent.text}`} />
                      </div>
                      <h3 className="text-sm font-bold text-[var(--color-text)] mb-1">
                        {sub.name}
                      </h3>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        {sub.topics.length} topic{sub.topics.length !== 1 ? "s" : ""}
                      </p>
                      <ArrowRight
                        className={`absolute top-5 right-5 h-4 w-4 ${accent.text} opacity-0 group-hover:opacity-100
                                    transition-all duration-200 group-hover:translate-x-0.5`}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 3: Topics */}
          {step === 3 && subDomainObj && (
            <div>
              <button
                onClick={() => backToStep(interestObj && interestObj.subDomains.length > 1 ? 2 : 1)}
                className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] hover:text-orange-400
                           transition-colors mb-5 cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                {interestObj && interestObj.subDomains.length > 1 ? "Back to sub-domains" : "Back to interests"}
              </button>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {subDomainObj.topics.map((topic, i) => {
                  const isSelected = selectedTopic === topic.id;
                  return (
                    <button
                      key={topic.id}
                      onClick={() => setSelectedTopic(topic.id)}
                      className={`group relative rounded-2xl p-4 border transition-all duration-200
                                 cursor-pointer text-left
                                 ${
                                   isSelected
                                     ? "glass border-orange-500/50 shadow-[0_0_24px_rgba(249,115,22,0.15)] -translate-y-0.5"
                                     : "glass border-[var(--color-border)] hover:border-orange-500/30 hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]"
                                 }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <Sparkles
                          className={`h-4 w-4 transition-colors ${
                            isSelected ? "text-orange-400" : "text-[var(--color-text-muted)] group-hover:text-orange-400/60"
                          }`}
                        />
                        {isSelected && (
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-white text-[10px]">
                            ✓
                          </span>
                        )}
                      </div>
                      <h3
                        className={`text-sm font-semibold transition-colors ${
                          isSelected ? "text-orange-400" : "text-[var(--color-text)]"
                        }`}
                      >
                        {topic.name}
                      </h3>
                    </button>
                  );
                })}
              </div>

              {/* Start CTA */}
              <div className="mt-8 flex justify-center animate-fade-in-up">
                <button
                  onClick={handleStart}
                  disabled={!selectedTopic || loading}
                  className="group inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl
                             text-base font-bold text-white
                             bg-gradient-to-r from-orange-500 to-orange-600
                             shadow-[0_4px_24px_rgba(249,115,22,0.3)]
                             transition-all duration-200
                             hover:shadow-[0_8px_32px_rgba(249,115,22,0.45)] hover:-translate-y-0.5
                             disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0
                             cursor-pointer"
                >
                  {loading ? (
                    <>
                      <div className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      {streamPhase || "Generating session…"}
                    </>
                  ) : (
                    <>
                      Start Learning
                      <Sparkles className="h-5 w-5 transition-transform group-hover:rotate-12" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
