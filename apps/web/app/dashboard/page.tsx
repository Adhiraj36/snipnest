"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth, useUser, SignInButton, SignOutButton } from "@clerk/nextjs";
import { GraduationCap, LogOut, Sparkles, Trophy, Zap, Target, BookOpen, Rocket, Star, Gem, CheckCircle2, Flame } from "lucide-react";
import {
  getMentorCatalog,
  getMentorStats,
  getMentorSessions,
  type MentorStats,
  type EnrichedSession,
} from "../lib/api";
import type { InterestDomain } from "@repo/shared-types";

/* ─── tiny helpers ─────────────────────────────────────────────────────────── */

function xpForLevel(level: number) {
  return level * 150;
}
function levelFromXp(xp: number) {
  let lvl = 1;
  let rem = xp;
  while (rem >= xpForLevel(lvl)) {
    rem -= xpForLevel(lvl);
    lvl++;
  }
  return { level: lvl, remaining: rem, needed: xpForLevel(lvl) };
}

function relTime(d: Date | string) {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

/* ─── badges ───────────────────────────────────────────────────────────────── */

type Badge = { icon: string; label: string; unlocked: boolean; desc: string };

function computeBadges(stats: MentorStats | null, sessions: EnrichedSession[]): Badge[] {
  const pts = stats?.totalPoints ?? 0;
  const completed = stats?.sessionsCompleted ?? 0;
  const perfectSessions = sessions.filter(
    (s) => s.status === "completed" && s.acceptedCount === s.questionCount && s.questionCount > 0
  ).length;

  return [
    { icon: "🔥", label: "First Steps", unlocked: pts > 0, desc: "Earn your first point" },
    { icon: "⭐", label: "Rising Star", unlocked: pts >= 50, desc: "Earn 50 points" },
    { icon: "🏆", label: "Champion", unlocked: pts >= 200, desc: "Earn 200 points" },
    { icon: "💎", label: "Diamond", unlocked: pts >= 500, desc: "Earn 500 points" },
    { icon: "✅", label: "Finisher", unlocked: completed >= 1, desc: "Complete a session" },
    { icon: "🎯", label: "Perfectionist", unlocked: perfectSessions >= 1, desc: "Perfect score in a session" },
    { icon: "📚", label: "Scholar", unlocked: completed >= 5, desc: "Complete 5 sessions" },
    { icon: "🚀", label: "Unstoppable", unlocked: completed >= 10, desc: "Complete 10 sessions" },
  ];
}

/* ─── Dashboard page ───────────────────────────────────────────────────────── */

export default function DashboardPage() {
  const { getToken, isLoaded } = useAuth();
  const { user } = useUser();

  const [stats, setStats] = useState<MentorStats | null>(null);
  const [sessions, setSessions] = useState<EnrichedSession[]>([]);
  const [catalog, setCatalog] = useState<InterestDomain[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;
    (async () => {
      try {
        const token = await getToken({ template: "codesarathi-backend" });
        if (!token) return;
        const [statsR, sessionsR, catalogR] = await Promise.all([
          getMentorStats(token),
          getMentorSessions(token),
          getMentorCatalog(token),
        ]);
        if (statsR.success) setStats(statsR.data);
        if (sessionsR.success) setSessions(sessionsR.data);
        if (catalogR.success) setCatalog(catalogR.data || []);
      } finally {
        setLoading(false);
      }
    })();
  }, [isLoaded, getToken]);

  const lvl = levelFromXp(stats?.totalPoints ?? 0);
  const badges = computeBadges(stats, sessions);
  const unlockedBadges = badges.filter((b) => b.unlocked);
  const activeSessions = sessions.filter((s) => s.status === "active");
  const completedSessions = sessions.filter((s) => s.status === "completed");

  const interestName = (id: string) => catalog.find((c) => c.id === id)?.name ?? id;

  return (
    <div className="landing-bg min-h-screen">
      {/* ── Header ─────────────────────────────────────────── */}
      <header className="fixed top-0 inset-x-0 z-50 glass border-b border-[var(--color-border)]">
        <div className="mx-auto max-w-6xl px-5 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl
                          bg-gradient-to-br from-orange-500 to-orange-600 text-white
                          shadow-[var(--shadow-md)] transition-transform duration-200
                          group-hover:scale-105"
            >
              <GraduationCap className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold tracking-tight text-[var(--color-text)]">
              Code Sarthi
            </span>
          </Link>
          <div className="flex items-center gap-3 text-sm">
            {user ? (
              <div className="flex items-center gap-3">
                <span className="text-[var(--color-text-muted)] text-sm hidden sm:inline">
                  {user.firstName || user.fullName}
                </span>
                <SignOutButton>
                  <button
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium
                               rounded-xl border border-[var(--color-border)] text-[var(--color-text-muted)]
                               glass transition-all duration-200
                               hover:border-orange-500/50 hover:text-orange-400 cursor-pointer"
                  >
                    <LogOut className="h-3 w-3" />
                    Sign out
                  </button>
                </SignOutButton>
              </div>
            ) : (
              <SignInButton>
                <button
                  className="px-4 py-2 text-sm font-semibold rounded-xl
                             bg-gradient-to-r from-orange-500 to-orange-600 text-white
                             shadow-[var(--shadow-md)] transition-all duration-200
                             hover:shadow-[var(--shadow-lg)] hover:-translate-y-0.5 cursor-pointer"
                >
                  Sign in
                </button>
              </SignInButton>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-5 pt-24 pb-12 space-y-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-3 animate-fade-in">
            <div className="h-8 w-8 rounded-full border-2 border-orange-500/30 border-t-orange-500 animate-spin" />
            <span className="text-sm text-[var(--color-text-muted)]">Loading dashboard…</span>
          </div>
        ) : (
          <>
            {/* ── Hero stats row ────────────────────────────── */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in-up">
              {/* Level card */}
              <div
                className="col-span-2 glass rounded-2xl p-6
                            border border-orange-500/20 shadow-[var(--shadow-lg)]
                            bg-gradient-to-br from-orange-500/10 to-transparent"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider font-medium">
                      Level
                    </div>
                    <div className="text-5xl font-black bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
                      {lvl.level}
                    </div>
                  </div>
                  <div
                    className="flex h-14 w-14 items-center justify-center rounded-2xl
                                bg-orange-500/10 border border-orange-500/20"
                  >
                    <span className="text-3xl">🎮</span>
                  </div>
                </div>
                <div className="w-full bg-zinc-800/60 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-orange-500 to-orange-400 h-full rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(100, (lvl.remaining / lvl.needed) * 100)}%` }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-[11px] text-[var(--color-text-muted)]">
                  <span>{lvl.remaining} XP</span>
                  <span>{lvl.needed} XP to next level</span>
                </div>
              </div>

              {/* Total XP */}
              <div className="glass rounded-2xl p-5 flex flex-col items-center justify-center border border-[var(--color-border)] shadow-[var(--shadow-sm)]">
                <Zap className="h-5 w-5 text-orange-400 mb-2" />
                <div className="text-3xl font-black text-orange-400">{stats?.totalPoints ?? 0}</div>
                <div className="text-xs text-[var(--color-text-muted)] mt-1">Total XP</div>
              </div>

              {/* Sessions */}
              <div className="glass rounded-2xl p-5 flex flex-col items-center justify-center border border-[var(--color-border)] shadow-[var(--shadow-sm)]">
                <BookOpen className="h-5 w-5 text-orange-400 mb-2" />
                <div className="text-3xl font-black text-orange-400">
                  {stats?.sessionsCompleted ?? 0}
                  <span className="text-lg text-[var(--color-text-muted)] font-normal">/{stats?.sessionsStarted ?? 0}</span>
                </div>
                <div className="text-xs text-[var(--color-text-muted)] mt-1">Sessions Complete</div>
              </div>
            </section>

            {/* ── Start new session CTA ────────────────────── */}
            <section className="animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
              <Link
                href="/mentor"
                className="group flex items-center justify-center gap-3 w-full py-4 rounded-2xl
                           text-lg font-bold text-white
                           bg-gradient-to-r from-orange-500 to-orange-600
                           shadow-[0_4px_24px_rgba(249,115,22,0.3)]
                           transition-all duration-200
                           hover:shadow-[0_8px_32px_rgba(249,115,22,0.45)] hover:-translate-y-0.5"
              >
                <Rocket className="h-5 w-5 transition-transform duration-200 group-hover:-translate-y-0.5" />
                Start New Mentor Session
              </Link>
            </section>

            {/* ── Badges ───────────────────────────────────── */}
            <section className="animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
              <h2 className="text-lg font-semibold text-[var(--color-text)] mb-3">
                Badges{" "}
                <span className="text-sm text-[var(--color-text-muted)] font-normal">
                  ({unlockedBadges.length}/{badges.length})
                </span>
              </h2>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
                {badges.map((b) => (
                  <div
                    key={b.label}
                    title={b.desc}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border transition-all duration-200 ${
                      b.unlocked
                        ? "glass border-orange-500/30 shadow-[0_0_20px_rgba(249,115,22,0.08)]"
                        : "glass border-[var(--color-border)] opacity-35 grayscale"
                    }`}
                  >
                    <span className="text-2xl">{b.icon}</span>
                    <span className="text-[10px] text-[var(--color-text-muted)] text-center leading-tight">{b.label}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* ── Active sessions ───────────────────────────── */}
            {activeSessions.length > 0 && (
              <section className="animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
                <h2 className="text-lg font-semibold text-[var(--color-text)] mb-3 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
                  Active Sessions{" "}
                  <span className="text-sm text-[var(--color-text-muted)] font-normal">({activeSessions.length})</span>
                </h2>
                <div className="grid gap-3">
                  {activeSessions.map((s) => (
                    <Link
                      key={s.id}
                      href={`/mentor?resume=${s.id}`}
                      className="flex items-center justify-between glass rounded-2xl p-4
                                 border border-[var(--color-border)] shadow-[var(--shadow-sm)]
                                 transition-all duration-200
                                 hover:border-orange-500/40 hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5 group"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className="w-11 h-11 rounded-xl bg-orange-500/10 border border-orange-500/20
                                      flex items-center justify-center text-lg"
                        >
                          {interestName(s.interest_id) === "JavaScript" ? "🟨" : interestName(s.interest_id) === "Python" ? "🐍" : "⚙️"}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-[var(--color-text)] group-hover:text-orange-400 transition-colors">
                            {interestName(s.interest_id)} — {s.topic_id}
                          </div>
                          <div className="text-xs text-[var(--color-text-muted)]">
                            Q{s.current_question_index + 1}/{s.questionCount} · {s.acceptedCount} solved · {relTime(s.updated_at)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-sm font-bold text-orange-400">{s.points_earned} XP</div>
                        </div>
                        <div className="w-10 h-10 relative">
                          <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
                            <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(63,63,70,0.4)" strokeWidth="3" />
                            <circle
                              cx="18"
                              cy="18"
                              r="15"
                              fill="none"
                              stroke="#f97316"
                              strokeWidth="3"
                              strokeDasharray={`${(s.acceptedCount / Math.max(1, s.questionCount)) * 94.2} 94.2`}
                              strokeLinecap="round"
                            />
                          </svg>
                          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-[var(--color-text-muted)]">
                            {Math.round((s.acceptedCount / Math.max(1, s.questionCount)) * 100)}%
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* ── Completed sessions ───────────────────────── */}
            <section className="animate-fade-in-up" style={{ animationDelay: "0.25s" }}>
              <h2 className="text-lg font-semibold text-[var(--color-text)] mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-orange-500" />
                Completed Sessions{" "}
                <span className="text-sm text-[var(--color-text-muted)] font-normal">({completedSessions.length})</span>
              </h2>
              {completedSessions.length === 0 ? (
                <div
                  className="flex flex-col items-center justify-center py-14 glass rounded-2xl
                              border border-[var(--color-border)] shadow-[var(--shadow-sm)]"
                >
                  <div className="text-4xl mb-3">📝</div>
                  <span className="text-sm text-[var(--color-text-muted)]">
                    No completed sessions yet. Start your first one!
                  </span>
                </div>
              ) : (
                <div className="grid gap-3">
                  {completedSessions.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between glass rounded-2xl p-4
                                 border border-[var(--color-border)] shadow-[var(--shadow-sm)]"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className="w-11 h-11 rounded-xl bg-orange-500/10 border border-orange-500/20
                                      flex items-center justify-center text-lg"
                        >
                          ✅
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-[var(--color-text)]">
                            {interestName(s.interest_id)} — {s.topic_id}
                          </div>
                          <div className="text-xs text-[var(--color-text-muted)]">
                            {s.acceptedCount}/{s.questionCount} solved · {relTime(s.created_at)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-sm font-bold text-orange-400">{s.points_earned} XP</div>
                          {s.acceptedCount === s.questionCount && s.questionCount > 0 && (
                            <div className="text-[10px] text-amber-400 font-medium">⭐ Perfect</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
