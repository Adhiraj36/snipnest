"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { useAuth, useUser, SignInButton, SignOutButton } from "@clerk/nextjs";
import type {
  InterestDomain,
  MentorQuestion,
  MentorSession,
  QuestionAttempt,
} from "@repo/shared-types";
import {
  getMentorAttempts,
  getMentorCatalog,
  getMentorStats,
  startMentorSessionStream,
  submitMentorAttempt,
  streamAvatarChat,
  type AvatarChatMessage,
  type MentorStats,
} from "../lib/api";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
});

/* ─── Chat Bubble ──────────────────────────────────────────────────────────── */

function ChatBubble({ role, content }: { role: "user" | "assistant"; content: string }) {
  const isUser = role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed ${
          isUser
            ? "bg-orange-500/20 text-orange-100 border border-orange-500/30"
            : "bg-zinc-800 text-zinc-200 border border-zinc-700"
        }`}
      >
        <pre className="whitespace-pre-wrap font-sans">{content}</pre>
      </div>
    </div>
  );
}

/* ─── Dashboard ────────────────────────────────────────────────────────────── */

export default function Dashboard() {
  const { getToken, isLoaded } = useAuth();
  const { user } = useUser();

  /* data */
  const [catalog, setCatalog] = useState<InterestDomain[]>([]);
  const [stats, setStats] = useState<MentorStats | null>(null);
  const [session, setSession] = useState<MentorSession | null>(null);
  const [questions, setQuestions] = useState<MentorQuestion[]>([]);
  const [attempts, setAttempts] = useState<QuestionAttempt[]>([]);

  /* selectors */
  const [selectedInterest, setSelectedInterest] = useState("");
  const [selectedSubDomain, setSelectedSubDomain] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("");

  /* editor */
  const [editorCode, setEditorCode] = useState("");

  /* ui */
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resultMessage, setResultMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [streamingTheory, setStreamingTheory] = useState("");
  const [streamPhase, setStreamPhase] = useState("");
  const [theoryOpen, setTheoryOpen] = useState(false);

  /* avatar chat */
  const [chatHistory, setChatHistory] = useState<AvatarChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatStreaming, setChatStreaming] = useState(false);
  const [streamingReply, setStreamingReply] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  /* ── initial load ──────────────────────────────────────────────────── */
  useEffect(() => {
    if (!isLoaded) return;
    const load = async () => {
      setLoading(true);
      try {
        const token = await getToken({ template: "codesarathi-backend" });
        if (!token) return setError("Failed to authenticate");
        const [catalogResp, statsResp] = await Promise.all([
          getMentorCatalog(token),
          getMentorStats(token),
        ]);
        if (catalogResp.success) {
          setCatalog(catalogResp.data || []);
          if (catalogResp.data.length > 0) {
            const first = catalogResp.data[0];
            setSelectedInterest(first.id);
            setSelectedSubDomain(first.subDomains[0]?.id || "");
            setSelectedTopic(first.subDomains[0]?.topics[0]?.id || "");
          }
        }
        if (statsResp.success) setStats(statsResp.data);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isLoaded, getToken]);

  /* ── derived ───────────────────────────────────────────────────────── */
  const interestObj = catalog.find((i) => i.id === selectedInterest);
  const subDomainObj = interestObj?.subDomains.find((s) => s.id === selectedSubDomain);
  const activeQ = questions.find(
    (q) => q.question_index === (session?.current_question_index ?? 0)
  );
  const lang = (() => {
    const id = session?.interest_id || selectedInterest;
    if (id === "python") return "python";
    if (id === "cpp") return "cpp";
    return "javascript";
  })();
  const visibleAttempts = attempts.filter(
    (a) => a.judge0_status.toLowerCase() !== "generated"
  );

  /* ── load attempts when question changes ───────────────────────────── */
  const loadAttempts = useCallback(
    async (sid: string, qid: string) => {
      const token = await getToken({ template: "codesarathi-backend" });
      if (!token) return;
      const r = await getMentorAttempts(token, sid, qid);
      if (r.success) setAttempts(r.data || []);
    },
    [getToken]
  );

  useEffect(() => {
    if (session?.id && activeQ?.id) loadAttempts(session.id, activeQ.id);
  }, [session?.id, activeQ?.id, loadAttempts]);

  /* scroll chat */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, streamingReply]);

  /* ── build context for avatar ──────────────────────────────────────── */
  const buildAvatarContext = useCallback(() => {
    const parts: string[] = [];
    if (session) {
      const interest = catalog.find((c) => c.id === session.interest_id);
      parts.push(
        `Topic: ${interest?.name || session.interest_id} > ${session.sub_domain_id} > ${session.topic_id}`
      );
      parts.push(`Session points: ${session.points_earned}`);
      parts.push(`Question ${(session.current_question_index ?? 0) + 1}/${questions.length}`);
    }
    if (activeQ) {
      parts.push(`Current question: ${activeQ.prompt}`);
      parts.push(`Difficulty: ${activeQ.difficulty}, Max points: ${activeQ.max_points}`);
    }
    if (editorCode.trim()) {
      parts.push(`Student's current code:\n\`\`\`\n${editorCode.slice(0, 1500)}\n\`\`\``);
    }
    if (visibleAttempts.length > 0) {
      const last = visibleAttempts[0];
      parts.push(
        `Last attempt: ${last.judge0_status}, score ${last.score}, feedback: ${last.llm_feedback}`
      );
    }
    if (session?.theory_content) {
      parts.push(`Theory summary (first 500 chars): ${session.theory_content.slice(0, 500)}`);
    }
    return parts.join("\n");
  }, [session, activeQ, editorCode, visibleAttempts, questions, catalog]);

  /* ── create session (streaming) ────────────────────────────────────── */
  const createSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInterest || !selectedSubDomain || !selectedTopic) return;
    setError(null);
    setResultMessage("");
    setStreamingTheory("");
    setStreamPhase("");
    setChatHistory([]);

    try {
      setLoading(true);
      const token = await getToken({ template: "codesarathi-backend" });
      if (!token) return setError("Failed to authenticate");

      await startMentorSessionStream(
        token,
        {
          interestId: selectedInterest,
          subDomainId: selectedSubDomain,
          topicId: selectedTopic,
          questionCount: 5,
        },
        {
          onTheoryChunk: (chunk) => setStreamingTheory((prev) => prev + chunk),
          onStatus: (_phase, message) => setStreamPhase(message),
          onSessionReady: (data) => {
            setSession(data.session);
            setQuestions(data.questions);
            setAttempts([]);
            setEditorCode(data.questions[0]?.starter_code || "");

            const topicName = data.topic?.name || selectedTopic;
            const welcomeMsg: AvatarChatMessage = {
              role: "assistant",
              content: `Welcome! Let's dive into ${topicName}. I've prepared theory material and ${data.questions.length} practice questions for you. Open the Theory panel if you want to read the full material, or ask me to explain any concept. Ready to start with the first question?`,
            };
            setChatHistory([welcomeMsg]);
          },
          onError: (msg) => setError(msg),
          onDone: () => {
            setStreamPhase("");
            setResultMessage("Session ready — start solving!");
          },
        }
      );

      const statsResp = await getMentorStats(token);
      if (statsResp.success) setStats(statsResp.data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  /* ── submit answer ─────────────────────────────────────────────────── */
  const submitAnswer = async () => {
    if (!session || !activeQ) return;
    setError(null);
    setResultMessage("");
    try {
      setSubmitting(true);
      const token = await getToken({ template: "codesarathi-backend" });
      if (!token) return setError("Failed to authenticate");

      const interest = catalog.find((i) => i.id === session.interest_id);
      const r = await submitMentorAttempt(token, session.id, {
        questionId: activeQ.id,
        submittedCode: editorCode,
        languageId: interest?.judge0LanguageId,
      });

      if (!r.success) throw new Error(r.error || "Submission failed");

      const nextIndex = r.data.nextQuestionIndex;
      setSession({
        ...session,
        current_question_index: nextIndex,
        points_earned: session.points_earned + r.data.pointsAwarded,
        status: r.data.completed ? "completed" : "active",
      });
      setEditorCode(
        questions.find((q) => q.question_index === nextIndex)?.starter_code || ""
      );
      setResultMessage(
        r.data.accepted
          ? `Accepted! +${r.data.pointsAwarded} points.`
          : "Not accepted yet. Check the mentor's feedback."
      );

      /* avatar reacts to submission */
      const feedbackMsg: AvatarChatMessage = {
        role: "assistant",
        content: r.data.accepted
          ? `Great work! Your solution was accepted and you earned ${r.data.pointsAwarded} points. ${r.data.completed ? "You've completed all questions in this session!" : "Let's move on to the next question. Take a look and let me know if you need any hints."}`
          : `Your submission wasn't accepted yet. Look at the attempt history for details. Would you like me to give you a hint about the approach without giving away the answer?`,
      };
      setChatHistory((prev) => [...prev, feedbackMsg]);

      const statsResp = await getMentorStats(token);
      if (statsResp.success) setStats(statsResp.data);
      await loadAttempts(session.id, activeQ.id);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  /* ── avatar chat ───────────────────────────────────────────────────── */
  const sendChat = async () => {
    if (!chatInput.trim() || chatStreaming) return;
    const userMsg: AvatarChatMessage = { role: "user", content: chatInput.trim() };
    const newHistory = [...chatHistory, userMsg];
    setChatHistory(newHistory);
    setChatInput("");
    setChatStreaming(true);
    setStreamingReply("");

    try {
      const token = await getToken({ template: "codesarathi-backend" });
      if (!token) return;

      let full = "";
      await streamAvatarChat(
        token,
        newHistory,
        buildAvatarContext(),
        (chunk) => {
          full += chunk;
          setStreamingReply((prev) => prev + chunk);
        },
        (finalContent) => {
          setChatHistory((prev) => [
            ...prev,
            { role: "assistant", content: finalContent || full },
          ]);
          setStreamingReply("");
        },
        (msg) => setError(msg)
      );
    } catch {
      setError("Chat failed");
    } finally {
      setChatStreaming(false);
    }
  };

  /* ── selector helpers ──────────────────────────────────────────────── */
  const onInterestChange = (id: string) => {
    setSelectedInterest(id);
    const obj = catalog.find((i) => i.id === id);
    setSelectedSubDomain(obj?.subDomains[0]?.id || "");
    setSelectedTopic(obj?.subDomains[0]?.topics[0]?.id || "");
  };
  const onSubDomainChange = (id: string) => {
    setSelectedSubDomain(id);
    const sub = interestObj?.subDomains.find((s) => s.id === id);
    setSelectedTopic(sub?.topics[0]?.id || "");
  };

  /* ─── Render ───────────────────────────────────────────────────────── */
  return (
    <div className="h-screen flex flex-col bg-zinc-950 text-zinc-100 overflow-hidden">
      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-5 py-3 border-b border-zinc-800 shrink-0">
        <h1 className="text-xl font-bold text-orange-400">SnipNest Mentor</h1>
        <div className="flex items-center gap-3 text-sm">
          {stats && (
            <div className="flex gap-3 mr-4 text-zinc-400">
              <span>
                <span className="text-orange-400 font-bold">{stats.totalPoints}</span> pts
              </span>
              <span>
                <span className="text-orange-400 font-bold">{stats.sessionsCompleted}</span>/
                {stats.sessionsStarted} sessions
              </span>
            </div>
          )}
          {user ? (
            <div className="flex items-center gap-2">
              <span className="text-zinc-300">{user.firstName || user.fullName}</span>
              <SignOutButton>
                <button className="px-2 py-1 text-xs bg-zinc-800 border border-zinc-700 rounded hover:border-orange-500 transition-colors">
                  Sign out
                </button>
              </SignOutButton>
            </div>
          ) : (
            <SignInButton>
              <button className="px-3 py-1 bg-orange-500 text-black rounded font-medium text-xs">
                Sign in
              </button>
            </SignInButton>
          )}
        </div>
      </header>

      {/* ── Body ─────────────────────────────────────────────── */}
      <div className="flex-1 flex min-h-0">
        {/* ── Left Column: Avatar + Learning Path ─────────── */}
        <aside className="w-80 shrink-0 border-r border-zinc-800 flex flex-col">
          {/* Avatar chat area */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400 text-sm font-bold">
                  AI
                </div>
                <div>
                  <div className="text-sm font-semibold text-zinc-100">Mentor</div>
                  <div className="text-[10px] text-zinc-500">
                    {chatStreaming ? "typing..." : "online"}
                  </div>
                </div>
              </div>
              {session && (
                <button
                  onClick={() => setTheoryOpen(!theoryOpen)}
                  className="text-[10px] px-2 py-1 rounded bg-zinc-800 border border-zinc-700 text-zinc-300 hover:border-orange-500 transition-colors"
                >
                  {theoryOpen ? "Hide" : "Show"} Theory
                </button>
              )}
            </div>

            {/* Chat messages */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
              {chatHistory.length === 0 && !session && (
                <div className="text-center text-zinc-500 text-sm mt-8">
                  <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-orange-500/10 border border-orange-500/30 flex items-center justify-center">
                    <span className="text-2xl">🎓</span>
                  </div>
                  <p>Select a topic and start a session.</p>
                  <p className="text-xs mt-1 text-zinc-600">
                    I'll explain theory, guide your solving, and score your work.
                  </p>
                </div>
              )}
              {chatHistory.map((msg, i) =>
                msg.role === "system" ? null : (
                  <ChatBubble key={i} role={msg.role} content={msg.content} />
                )
              )}
              {streamingReply && <ChatBubble role="assistant" content={streamingReply} />}
              <div ref={chatEndRef} />
            </div>

            {/* Chat input */}
            {session && (
              <div className="px-3 pb-3">
                <div className="flex gap-2">
                  <input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendChat()}
                    placeholder="Ask the mentor..."
                    disabled={chatStreaming}
                    className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500 disabled:opacity-50"
                  />
                  <button
                    onClick={sendChat}
                    disabled={chatStreaming || !chatInput.trim()}
                    className="px-3 py-2 bg-orange-500 text-black rounded-lg text-sm font-semibold hover:bg-orange-400 disabled:opacity-50 transition-colors"
                  >
                    ↑
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Learning Path selector */}
          <div className="border-t border-zinc-800 p-4 space-y-3 shrink-0">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Learning Path
            </h3>
            <form onSubmit={createSession} className="space-y-2">
              <select
                value={selectedInterest}
                onChange={(e) => onInterestChange(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-sm"
              >
                {catalog.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name}
                  </option>
                ))}
              </select>
              <select
                value={selectedSubDomain}
                onChange={(e) => onSubDomainChange(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-sm"
              >
                {(interestObj?.subDomains || []).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <select
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-sm"
              >
                {(subDomainObj?.topics || []).map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                disabled={!user || loading}
                className="w-full bg-orange-500 text-black font-semibold py-2 rounded text-sm hover:bg-orange-400 disabled:opacity-50 transition-colors"
              >
                {loading ? streamPhase || "Generating..." : "Start Session"}
              </button>
            </form>
          </div>
        </aside>

        {/* ── Right Column: Question + Editor ─────────────── */}
        <main className="flex-1 flex flex-col min-h-0 relative">
          {!session ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-3 max-w-md">
                <div className="text-5xl">👨‍💻</div>
                <h2 className="text-xl font-semibold text-zinc-200">Ready to practice?</h2>
                <p className="text-sm text-zinc-400">
                  Pick a language, subdomain, and topic from the sidebar. The AI mentor will
                  generate theory and coding questions for you.
                </p>
                {streamingTheory && (
                  <div className="text-left mt-4 bg-zinc-900 border border-zinc-800 rounded-lg p-4 max-h-48 overflow-y-auto">
                    <p className="text-xs text-zinc-500 mb-2">Streaming theory...</p>
                    <pre className="whitespace-pre-wrap text-sm text-zinc-300 leading-5">
                      {streamingTheory}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Question bar */}
              <div className="px-5 py-3 border-b border-zinc-800 shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="shrink-0 text-xs font-mono px-2 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-400">
                      Q{(session.current_question_index ?? 0) + 1}/{questions.length}
                    </span>
                    <span
                      className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider ${
                        activeQ?.difficulty === "hard"
                          ? "bg-red-500/15 text-red-400 border border-red-500/30"
                          : activeQ?.difficulty === "medium"
                          ? "bg-yellow-500/15 text-yellow-400 border border-yellow-500/30"
                          : "bg-green-500/15 text-green-400 border border-green-500/30"
                      }`}
                    >
                      {activeQ?.difficulty || "easy"}
                    </span>
                    {visibleAttempts.length > 0 && (
                      <span className="shrink-0 text-[10px] px-2 py-0.5 rounded-full bg-orange-500/15 border border-orange-500/40 text-orange-400 font-semibold">
                        Best: {Math.max(...visibleAttempts.map((a) => a.score))}/
                        {activeQ?.max_points ?? 10}
                      </span>
                    )}
                    <p className="text-sm text-zinc-200 truncate">
                      {activeQ?.prompt || "Session complete."}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-3 shrink-0">
                    <span className="text-xs text-zinc-500">
                      <span className="text-orange-400 font-bold">{session.points_earned}</span> pts
                    </span>
                  </div>
                </div>
                {activeQ && activeQ.prompt.length > 80 && (
                  <p className="mt-2 text-sm text-zinc-300 leading-relaxed">{activeQ.prompt}</p>
                )}
              </div>

              {/* Monaco Editor */}
              <div className="flex-1 min-h-0">
                <MonacoEditor
                  height="100%"
                  theme="vs-dark"
                  language={lang}
                  value={editorCode}
                  onChange={(v: string | undefined) => setEditorCode(v || "")}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    automaticLayout: true,
                    scrollBeyondLastLine: false,
                    readOnly: !activeQ || session.status === "completed",
                    padding: { top: 12 },
                  }}
                />
              </div>

              {/* Action bar */}
              <div className="px-5 py-3 border-t border-zinc-800 shrink-0 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {resultMessage && (
                    <span
                      className={`text-xs px-3 py-1 rounded-full ${
                        resultMessage.includes("Accepted")
                          ? "bg-green-500/15 text-green-400 border border-green-500/30"
                          : "bg-zinc-800 text-zinc-300 border border-zinc-700"
                      }`}
                    >
                      {resultMessage}
                    </span>
                  )}
                  {error && <span className="text-xs text-red-400">{error}</span>}
                </div>
                <div className="flex items-center gap-2">
                  {visibleAttempts.length > 0 && (
                    <details className="relative">
                      <summary className="text-xs text-zinc-400 cursor-pointer hover:text-zinc-200 px-3 py-1.5 bg-zinc-900 border border-zinc-700 rounded transition-colors">
                        Attempts ({visibleAttempts.length})
                      </summary>
                      <div className="absolute bottom-full right-0 mb-2 w-96 max-h-72 overflow-y-auto bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl p-3 space-y-2 z-50">
                        {visibleAttempts.map((a) => (
                          <div
                            key={a.id}
                            className="border border-zinc-800 rounded p-2 bg-zinc-950 space-y-1"
                          >
                            <div className="flex justify-between text-[11px]">
                              <span className="text-zinc-400">
                                {new Date(a.created_at).toLocaleString()}
                              </span>
                              <span className="text-orange-400 font-semibold">
                                {a.judge0_status} · {a.score} pts
                              </span>
                            </div>
                            <p className="text-xs text-zinc-300">{a.llm_feedback}</p>
                            {a.stderr && (
                              <pre className="text-[10px] text-red-300 bg-black/40 rounded p-1.5 whitespace-pre-wrap">
                                {a.stderr}
                              </pre>
                            )}
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                  <button
                    onClick={submitAnswer}
                    disabled={!activeQ || submitting || session.status === "completed"}
                    className="px-5 py-2 bg-orange-500 text-black rounded font-semibold text-sm hover:bg-orange-400 disabled:opacity-50 transition-colors"
                  >
                    {submitting ? "Running..." : "Run & Submit"}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* ── Theory slide-over ────────────────────────── */}
          {theoryOpen && session && (
            <div className="absolute inset-0 z-40 flex">
              <div className="absolute inset-0 bg-black/50" onClick={() => setTheoryOpen(false)} />
              <div className="relative ml-auto w-[28rem] max-w-full h-full bg-zinc-900 border-l border-zinc-700 shadow-2xl flex flex-col">
                <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800">
                  <h3 className="font-semibold text-zinc-100">Theory — {session.topic_id}</h3>
                  <button
                    onClick={() => setTheoryOpen(false)}
                    className="text-zinc-400 hover:text-zinc-100 text-lg"
                  >
                    ✕
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto px-5 py-4">
                  <pre className="whitespace-pre-wrap text-sm text-zinc-300 leading-6 font-sans">
                    {session.theory_content || streamingTheory || "No theory generated."}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
