"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth, useUser, SignInButton, SignOutButton } from "@clerk/nextjs";
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
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* ── Header ─────────────────────────────────────────── */}
      <header className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-orange-400">SnipNest</h1>
        <div className="flex items-center gap-4 text-sm">
          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-zinc-300">{user.firstName || user.fullName}</span>
              <SignOutButton>
                <button className="px-2 py-1 text-xs bg-zinc-800 border border-zinc-700 rounded hover:border-orange-500 transition-colors">
                  Sign out
                </button>
              </SignOutButton>
            </div>
          ) : (
            <SignInButton>
              <button className="px-3 py-1.5 bg-orange-500 text-black rounded font-semibold text-xs">
                Sign in
              </button>
            </SignInButton>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {loading ? (
          <div className="text-center text-zinc-500 py-20">Loading dashboard...</div>
        ) : (
          <>
            {/* ── Hero stats row ────────────────────────────── */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Level card */}
              <div className="col-span-2 bg-gradient-to-br from-orange-500/10 to-zinc-900 border border-orange-500/30 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-xs text-zinc-400 uppercase tracking-wider">Level</div>
                    <div className="text-4xl font-black text-orange-400">{lvl.level}</div>
                  </div>
                  <div className="text-5xl">🎮</div>
                </div>
                <div className="w-full bg-zinc-800 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-orange-500 h-full rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(100, (lvl.remaining / lvl.needed) * 100)}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1.5 text-[11px] text-zinc-500">
                  <span>{lvl.remaining} XP</span>
                  <span>{lvl.needed} XP to next level</span>
                </div>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col items-center justify-center">
                <div className="text-3xl font-black text-orange-400">{stats?.totalPoints ?? 0}</div>
                <div className="text-xs text-zinc-500 mt-1">Total XP</div>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col items-center justify-center">
                <div className="text-3xl font-black text-orange-400">
                  {stats?.sessionsCompleted ?? 0}
                  <span className="text-lg text-zinc-500 font-normal">/{stats?.sessionsStarted ?? 0}</span>
                </div>
                <div className="text-xs text-zinc-500 mt-1">Sessions Complete</div>
              </div>
            </section>

            {/* ── Start new session CTA ────────────────────── */}
            <section>
              <Link
                href="/mentor"
                className="block w-full bg-orange-500 hover:bg-orange-400 text-black font-bold text-center py-4 rounded-xl text-lg transition-colors"
              >
                🚀 Start New Mentor Session
              </Link>
            </section>

            {/* ── Badges ───────────────────────────────────── */}
            <section>
              <h2 className="text-lg font-semibold mb-3">
                Badges{" "}
                <span className="text-sm text-zinc-500 font-normal">
                  ({unlockedBadges.length}/{badges.length})
                </span>
              </h2>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
                {badges.map((b) => (
                  <div
                    key={b.label}
                    title={b.desc}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-all ${
                      b.unlocked
                        ? "bg-zinc-900 border-orange-500/40 shadow-lg shadow-orange-500/5"
                        : "bg-zinc-900/50 border-zinc-800 opacity-40 grayscale"
                    }`}
                  >
                    <span className="text-2xl">{b.icon}</span>
                    <span className="text-[10px] text-zinc-400 text-center leading-tight">{b.label}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* ── Active sessions ───────────────────────────── */}
            {activeSessions.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold mb-3">
                  🔴 Active Sessions{" "}
                  <span className="text-sm text-zinc-500 font-normal">({activeSessions.length})</span>
                </h2>
                <div className="grid gap-3">
                  {activeSessions.map((s) => (
                    <Link
                      key={s.id}
                      href={`/mentor?resume=${s.id}`}
                      className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-orange-500/50 transition-colors group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-lg">
                          {interestName(s.interest_id) === "JavaScript" ? "🟨" : interestName(s.interest_id) === "Python" ? "🐍" : "⚙️"}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-zinc-100 group-hover:text-orange-400 transition-colors">
                            {interestName(s.interest_id)} — {s.topic_id}
                          </div>
                          <div className="text-xs text-zinc-500">
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
                            <circle cx="18" cy="18" r="15" fill="none" stroke="#27272a" strokeWidth="3" />
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
                          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-zinc-300">
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
            <section>
              <h2 className="text-lg font-semibold mb-3">
                ✅ Completed Sessions{" "}
                <span className="text-sm text-zinc-500 font-normal">({completedSessions.length})</span>
              </h2>
              {completedSessions.length === 0 ? (
                <div className="text-center text-zinc-500 py-12 bg-zinc-900 border border-zinc-800 rounded-xl">
                  <div className="text-4xl mb-2">📝</div>
                  No completed sessions yet. Start your first one!
                </div>
              ) : (
                <div className="grid gap-3">
                  {completedSessions.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-xl p-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-green-500/10 border border-green-500/30 flex items-center justify-center text-lg">
                          ✅
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-zinc-100">
                            {interestName(s.interest_id)} — {s.topic_id}
                          </div>
                          <div className="text-xs text-zinc-500">
                            {s.acceptedCount}/{s.questionCount} solved · {relTime(s.created_at)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-sm font-bold text-orange-400">{s.points_earned} XP</div>
                          {s.acceptedCount === s.questionCount && s.questionCount > 0 && (
                            <div className="text-[10px] text-yellow-400">⭐ Perfect</div>
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
