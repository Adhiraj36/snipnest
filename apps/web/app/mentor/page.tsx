"use client";

import { Suspense, useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useAuth, useUser } from "@clerk/nextjs";
import type {
  InterestDomain,
  MentorQuestion,
  MentorSession,
  QuestionAttempt,
} from "@repo/shared-types";
import {
  getMentorAttempts,
  getMentorCatalog,
  getMentorSession,
  getMentorStats,
  startMentorSessionStream,
  submitMentorAttempt,
  streamAvatarChat,
  getAvatarConfig,
  getAvatarSessionToken,
  type AvatarChatMessage,
  type MentorStats,
} from "../lib/api";
import LiveAvatarMentor, {
  type LiveAvatarMentorHandle,
} from "../components/LiveAvatarMentor";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
});

/* ─── Chat Bubble ──────────────────────────────────────────────────────────── */

function ChatBubble({
  role,
  content,
}: {
  role: "user" | "assistant";
  content: string;
}) {
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

/* ─── Mentor Page ──────────────────────────────────────────────────────────── */

export default function MentorPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-zinc-950 text-zinc-400">Loading…</div>}>
      <MentorPageInner />
    </Suspense>
  );
}

function MentorPageInner() {
  const { getToken, isLoaded } = useAuth();
  const { user } = useUser();
  const searchParams = useSearchParams();
  const resumeId = searchParams.get("resume");

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
  const theoryEndRef = useRef<HTMLDivElement>(null);

  /* track current question index to detect question changes */
  const prevQIndexRef = useRef<number | null>(null);

  /* avatar mode */
  type MentorMode = "chat" | "avatar";
  const [mentorMode, setMentorMode] = useState<MentorMode>("chat");
  const [avatarAvailable, setAvatarAvailable] = useState(false);
  const [avatarSessionToken, setAvatarSessionToken] = useState<string | null>(
    null
  );
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const avatarRef = useRef<LiveAvatarMentorHandle>(null);

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

        /* Check if avatar feature is available */
        const avatarCfg = await getAvatarConfig(token);
        if (avatarCfg.success && avatarCfg.data?.available) {
          setAvatarAvailable(true);
        }

        /* Resume existing session if ?resume=<id> */
        if (resumeId && token) {
          const sessionResp = await getMentorSession(token, resumeId);
          if (sessionResp.success) {
            const sess = sessionResp.data.session;
            const qs = sessionResp.data.questions;
            setSession(sess);
            setQuestions(qs);
            const qi = sess.current_question_index ?? 0;
            const q = qs.find((q) => q.question_index === qi);

            /* Pre-load the latest submission for the current question */
            let resumedCode = q?.starter_code || "";
            if (q) {
              const attResp = await getMentorAttempts(token, resumeId, q.id);
              if (attResp.success && attResp.data && attResp.data.length > 0) {
                const real = attResp.data.filter(
                  (a) => a.judge0_status.toLowerCase() !== "generated"
                );
                if (real.length > 0) {
                  resumedCode = real[0].submitted_code || resumedCode;
                }
              }
            }
            setEditorCode(resumedCode);
            prevQIndexRef.current = qi;
            setChatHistory([
              {
                role: "assistant",
                content: `Welcome back! You're on question ${qi + 1}/${qs.length}. Let me know if you need any help.`,
              },
            ]);
          }
        }
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isLoaded, getToken, resumeId]);

  /* ── derived ───────────────────────────────────────────────────────── */
  const interestObj = catalog.find((i) => i.id === selectedInterest);
  const subDomainObj = interestObj?.subDomains.find(
    (s) => s.id === selectedSubDomain
  );
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

  /* auto-scroll chat */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, streamingReply]);

  /* auto-scroll theory during streaming */
  useEffect(() => {
    theoryEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [streamingTheory]);

  /* ── build context for avatar (FULL submission history) ────────────── */
  const buildAvatarContext = useCallback(() => {
    const parts: string[] = [];
    if (session) {
      const interest = catalog.find((c) => c.id === session.interest_id);
      parts.push(
        `Topic: ${interest?.name || session.interest_id} > ${session.sub_domain_id} > ${session.topic_id}`
      );
      parts.push(`Session points: ${session.points_earned}`);
      parts.push(
        `Question ${(session.current_question_index ?? 0) + 1}/${questions.length}`
      );
    }
    if (activeQ) {
      parts.push(`Current question: ${activeQ.prompt}`);
      parts.push(
        `Difficulty: ${activeQ.difficulty}, Max points: ${activeQ.max_points}`
      );
    }
    if (editorCode.trim()) {
      parts.push(
        `Student's current code:\n\`\`\`\n${editorCode.slice(0, 2000)}\n\`\`\``
      );
    }
    /* Include ALL visible attempts for full context */
    if (visibleAttempts.length > 0) {
      parts.push(`\n--- Submission History (${visibleAttempts.length} attempts) ---`);
      visibleAttempts.slice(0, 10).forEach((a, i) => {
        parts.push(
          `Attempt ${i + 1}: Status=${a.judge0_status}, Score=${a.score}/${activeQ?.max_points ?? 10}`
        );
        if (a.llm_feedback) parts.push(`  Feedback: ${a.llm_feedback}`);
        if (a.stderr) parts.push(`  Error: ${a.stderr.slice(0, 300)}`);
        if (a.stdout) parts.push(`  Output: ${a.stdout.slice(0, 200)}`);
        if (a.submitted_code)
          parts.push(
            `  Code submitted:\n\`\`\`\n${a.submitted_code.slice(0, 800)}\n\`\`\``
          );
      });
    }
    if (session?.theory_content) {
      parts.push(
        `\nTheory summary (first 500 chars): ${session.theory_content.slice(0, 500)}`
      );
    }
    return parts.join("\n");
  }, [session, activeQ, editorCode, visibleAttempts, questions, catalog]);

  /* ── avatar session management ─────────────────────────────────── */
  const startAvatarSession = useCallback(async () => {
    setAvatarError(null);
    setAvatarLoading(true);
    try {
      const token = await getToken({ template: "codesarathi-backend" });
      if (!token) { setAvatarError("Auth failed"); return; }
      const resp = await getAvatarSessionToken(token);
      if (!resp.success) { setAvatarError(resp.error || "Failed to get avatar token"); return; }
      setAvatarSessionToken(resp.data.session_token);
    } catch (e: any) {
      setAvatarError(e.message);
    } finally {
      setAvatarLoading(false);
    }
  }, [getToken]);

  const stopAvatarSession = useCallback(() => {
    setAvatarSessionToken(null);
    setMentorMode("chat");
  }, []);

  /** Switch to avatar mode — starts session if needed, sends current context */
  const switchToAvatar = useCallback(async () => {
    setMentorMode("avatar");
    if (!avatarSessionToken) {
      await startAvatarSession();
    }
  }, [avatarSessionToken, startAvatarSession]);

  /** Pipe a text message to the live avatar (non-blocking, best-effort, with retry) */
  const sendToAvatar = useCallback(
    (text: string) => {
      if (mentorMode !== "avatar") return;
      const trySend = (retries: number) => {
        if (avatarRef.current?.isReady) {
          avatarRef.current.sendMessage(text);
        } else if (retries > 0) {
          setTimeout(() => trySend(retries - 1), 1500);
        }
      };
      trySend(3);
    },
    [mentorMode]
  );

  /** Build a concise spoken context string for the avatar */
  const buildSpokenContext = useCallback(() => {
    const parts: string[] = [];
    if (session) {
      const interest = catalog.find((c) => c.id === session.interest_id);
      parts.push(
        `The student is learning ${interest?.name || session.interest_id}, specifically ${session.sub_domain_id} — ${session.topic_id}.`
      );
      parts.push(
        `They are on question ${(session.current_question_index ?? 0) + 1} of ${questions.length}. Session points so far: ${session.points_earned}.`
      );
    }
    if (activeQ) {
      parts.push(
        `Current question (${activeQ.difficulty}, worth ${activeQ.max_points} pts): ${activeQ.prompt}`
      );
    }
    if (editorCode.trim()) {
      parts.push(
        `The student's current code:\n${editorCode.slice(0, 1500)}`
      );
    }
    return parts.join(" ");
  }, [session, activeQ, editorCode, questions, catalog]);

  /* ── Send context to avatar when question changes or avatar becomes ready ── */
  const lastSentQRef = useRef<string | null>(null);
  useEffect(() => {
    if (
      mentorMode !== "avatar" ||
      !avatarRef.current?.isReady ||
      !activeQ
    ) return;
    // Only send when question actually changes
    if (lastSentQRef.current === activeQ.id) return;
    lastSentQRef.current = activeQ.id;

    const ctx = buildSpokenContext();
    if (ctx) {
      avatarRef.current.sendMessage(
        `Here is context about what the student is currently working on. Use this to help them but don't repeat it back verbatim — just acknowledge and offer help naturally: ${ctx}`
      );
    }
  }, [mentorMode, activeQ?.id, buildSpokenContext]);

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
          onTheoryChunk: (chunk) =>
            setStreamingTheory((prev) => prev + chunk),
          onStatus: (_phase, message) => setStreamPhase(message),
          onSessionReady: (data) => {
            setSession(data.session);
            setQuestions(data.questions);
            setAttempts([]);
            setEditorCode(data.questions[0]?.starter_code || "");
            prevQIndexRef.current = 0;

            const topicName = data.topic?.name || selectedTopic;
            const welcomeMsg: AvatarChatMessage = {
              role: "assistant",
              content: `Welcome! Let's dive into ${topicName}. I've prepared theory material and ${data.questions.length} practice questions for you. Open the Theory panel to read the material, or ask me to explain any concept. Ready for the first question?`,
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
    const submittedCode = editorCode; // capture before any state changes
    try {
      setSubmitting(true);
      const token = await getToken({ template: "codesarathi-backend" });
      if (!token) return setError("Failed to authenticate");

      const interest = catalog.find((i) => i.id === session.interest_id);
      const r = await submitMentorAttempt(token, session.id, {
        questionId: activeQ.id,
        submittedCode,
        languageId: interest?.judge0LanguageId,
      });

      if (!r.success) throw new Error(r.error || "Submission failed");

      const nextIndex = r.data.nextQuestionIndex;
      const questionChanged = nextIndex !== (session.current_question_index ?? 0);

      setSession({
        ...session,
        current_question_index: nextIndex,
        points_earned: session.points_earned + r.data.pointsAwarded,
        status: r.data.completed ? "completed" : "active",
      });

      /* Only change editor code if we're moving to a NEW question */
      if (questionChanged) {
        const nextQ = questions.find((q) => q.question_index === nextIndex);
        setEditorCode(nextQ?.starter_code || "");
        prevQIndexRef.current = nextIndex;
      }
      /* Otherwise keep the user's code in the editor */

      setResultMessage(
        r.data.accepted
          ? `Accepted! +${r.data.pointsAwarded} points.`
          : "Not accepted yet. Check the mentor's feedback."
      );

      /* Build detailed feedback message for chat including submission details */
      const attempt = r.data.attempt;
      let feedbackContent: string;
      if (r.data.accepted) {
        feedbackContent = `✅ **Accepted!** Score: ${attempt?.score ?? activeQ.max_points}/${activeQ.max_points} (+${r.data.pointsAwarded} XP)`;
        if (r.data.completed) {
          feedbackContent +=
            "\n\n🎉 You've completed all questions in this session! Head back to the dashboard to see your progress.";
        } else {
          feedbackContent +=
            "\n\nGreat work! Let's move on to the next question. Take a look and let me know if you need any hints.";
        }
      } else {
        feedbackContent = `❌ **Not accepted** — Judge: ${attempt?.judge0_status || "Wrong Answer"}, Score: ${attempt?.score ?? 0}/${activeQ.max_points}`;
        if (attempt?.llm_feedback) {
          feedbackContent += `\n\n💡 Feedback: ${attempt.llm_feedback}`;
        }
        if (attempt?.stderr) {
          feedbackContent += `\n\n⚠️ Error:\n\`\`\`\n${attempt.stderr.slice(0, 500)}\n\`\`\``;
        }
        if (attempt?.stdout) {
          feedbackContent += `\n\nOutput: \`${attempt.stdout.trim().slice(0, 200)}\``;
        }
        feedbackContent +=
          "\n\nWould you like me to give you a hint about the approach?";
      }

      setChatHistory((prev) => [
        ...prev,
        { role: "assistant", content: feedbackContent },
      ]);

      /* Also send a concise summary to the live avatar if active */
      if (r.data.accepted) {
        sendToAvatar(
          `The student just submitted their code and it was accepted! They scored ${attempt?.score ?? activeQ.max_points} out of ${activeQ.max_points} points. Their submitted code:\n${submittedCode.slice(0, 1200)}\nPlease congratulate them briefly and encourage them to continue.`
        );
      } else {
        sendToAvatar(
          `The student just submitted their code but it was not accepted. Judge status: ${attempt?.judge0_status || "Wrong Answer"}. Score: ${attempt?.score ?? 0}/${activeQ.max_points}. ${attempt?.llm_feedback ? "Feedback: " + attempt.llm_feedback.slice(0, 200) : ""} Their submitted code:\n${submittedCode.slice(0, 1200)}\nPlease give a brief, encouraging spoken hint about what might be wrong.`
        );
      }

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
    const text = chatInput.trim();
    const userMsg: AvatarChatMessage = { role: "user", content: text };

    // In avatar mode, send to the avatar (voice) and add user msg to chat
    if (
      mentorMode === "avatar" &&
      avatarRef.current?.isReady
    ) {
      setChatHistory((prev) => [...prev, userMsg]);
      setChatInput("");
      avatarRef.current.sendMessage(text);
      return;
    }

    // Text chat mode – stream from backend
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
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="text-zinc-400 hover:text-orange-400 text-sm transition-colors"
          >
            ← Dashboard
          </Link>
          <h1 className="text-xl font-bold text-orange-400">Mentor Session</h1>
        </div>
        <div className="flex items-center gap-3 text-sm">
          {stats && (
            <div className="flex gap-3 mr-4 text-zinc-400">
              <span>
                <span className="text-orange-400 font-bold">
                  {stats.totalPoints}
                </span>{" "}
                pts
              </span>
              <span>
                <span className="text-orange-400 font-bold">
                  {stats.sessionsCompleted}
                </span>
                /{stats.sessionsStarted} sessions
              </span>
            </div>
          )}
          <span className="text-zinc-300 text-xs">
            {user?.firstName || user?.fullName}
          </span>
        </div>
      </header>

      {/* ── Body ─────────────────────────────────────────────── */}
      <div className="flex-1 flex min-h-0">
        {/* ── Left Column: Avatar/Chat + Learning Path ─────────── */}
        <aside className="w-80 shrink-0 border-r border-zinc-800 flex flex-col">
          {/* Mode toggle + header */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400 text-sm font-bold">
                  {mentorMode === "avatar" ? "🎥" : "AI"}
                </div>
                <div>
                  <div className="text-sm font-semibold text-zinc-100">
                    Mentor
                  </div>
                  <div className="text-[10px] text-zinc-500">
                    {mentorMode === "avatar"
                      ? avatarSessionToken
                        ? "avatar live"
                        : "avatar offline"
                      : chatStreaming
                        ? "typing..."
                        : "online"}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {/* Avatar / Chat toggle */}
                {avatarAvailable && (
                  <div className="flex bg-zinc-800 rounded-md border border-zinc-700 text-[10px] overflow-hidden">
                    <button
                      onClick={() => setMentorMode("chat")}
                      className={`px-2 py-1 transition-colors ${
                        mentorMode === "chat"
                          ? "bg-orange-500/20 text-orange-400"
                          : "text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      Chat
                    </button>
                    <button
                      onClick={switchToAvatar}
                      disabled={avatarLoading}
                      className={`px-2 py-1 transition-colors ${
                        mentorMode === "avatar"
                          ? "bg-orange-500/20 text-orange-400"
                          : "text-zinc-400 hover:text-zinc-200"
                      } disabled:opacity-50`}
                    >
                      {avatarLoading ? "..." : "Avatar"}
                    </button>
                  </div>
                )}
                {session && (
                  <button
                    onClick={() => setTheoryOpen(!theoryOpen)}
                    className="text-[10px] px-2 py-1 rounded bg-zinc-800 border border-zinc-700 text-zinc-300 hover:border-orange-500 transition-colors"
                  >
                    {theoryOpen ? "Hide" : "📖"} Theory
                  </button>
                )}
              </div>
            </div>

            {/* Avatar video (shown when avatar mode active) */}
            {mentorMode === "avatar" && (
              <div className="px-3 pt-3 shrink-0">
                {avatarSessionToken ? (
                  <LiveAvatarMentor
                    ref={avatarRef}
                    sessionToken={avatarSessionToken}
                    onDisconnected={stopAvatarSession}
                    onUserTranscript={(text) => {
                      setChatHistory((prev) => [
                        ...prev,
                        { role: "user", content: text },
                      ]);
                    }}
                    onAvatarTranscript={(text) => {
                      setChatHistory((prev) => [
                        ...prev,
                        { role: "assistant", content: text },
                      ]);
                    }}
                  />
                ) : (
                  <div className="w-full aspect-video bg-zinc-900 rounded-lg border border-zinc-800 flex flex-col items-center justify-center gap-2">
                    {avatarLoading ? (
                      <>
                        <div className="w-6 h-6 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
                        <span className="text-[10px] text-zinc-500">
                          Starting avatar...
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-2xl">🎥</span>
                        <button
                          onClick={startAvatarSession}
                          className="text-xs px-3 py-1 bg-orange-500 text-black rounded font-semibold hover:bg-orange-400 transition-colors"
                        >
                          Start Avatar
                        </button>
                        {avatarError && (
                          <p className="text-[10px] text-red-400">
                            {avatarError}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Chat messages */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 thin-scrollbar">
              {chatHistory.length === 0 && !session && (
                <div className="text-center text-zinc-500 text-sm mt-8">
                  <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-orange-500/10 border border-orange-500/30 flex items-center justify-center">
                    <span className="text-2xl">🎓</span>
                  </div>
                  <p>Select a topic and start a session.</p>
                  <p className="text-xs mt-1 text-zinc-600">
                    I'll explain theory, guide your solving, and score your
                    work.
                  </p>
                </div>
              )}
              {chatHistory.map((msg, i) =>
                msg.role === "system" ? null : (
                  <ChatBubble key={i} role={msg.role} content={msg.content} />
                )
              )}
              {streamingReply && (
                <ChatBubble role="assistant" content={streamingReply} />
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat input */}
            {session && (
              <div className="px-3 pb-3">
                <div className="flex gap-2">
                  <input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && !e.shiftKey && sendChat()
                    }
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
          {!session && (
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
          )}

          {/* Session info when active */}
          {session && (
            <div className="border-t border-zinc-800 p-4 shrink-0 space-y-2">
              <div className="flex justify-between text-xs text-zinc-400">
                <span>{session.interest_id} / {session.topic_id}</span>
                <span className={session.status === "completed" ? "text-green-400" : "text-orange-400"}>
                  {session.status}
                </span>
              </div>
              <div className="text-xs text-zinc-500">
                Session pts: <span className="text-orange-400 font-bold">{session.points_earned}</span>
              </div>
            </div>
          )}
        </aside>

        {/* ── Right Column: Question + Editor ─────────────── */}
        <main className="flex-1 flex flex-col min-h-0 relative">
          {!session ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-3 max-w-md">
                <div className="text-5xl">👨‍💻</div>
                <h2 className="text-xl font-semibold text-zinc-200">
                  Ready to practice?
                </h2>
                <p className="text-sm text-zinc-400">
                  Pick a language, subdomain, and topic from the sidebar. The
                  AI mentor will stream theory and coding questions for you.
                </p>
                {streamingTheory && (
                  <div className="text-left mt-4 bg-zinc-900 border border-zinc-800 rounded-lg p-4 max-h-48 overflow-y-auto">
                    <p className="text-xs text-zinc-500 mb-2">
                      Streaming theory...
                    </p>
                    <div className="prose prose-sm prose-invert max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {streamingTheory}
                      </ReactMarkdown>
                    </div>
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
                      Q{(session.current_question_index ?? 0) + 1}/
                      {questions.length}
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
                        Best:{" "}
                        {Math.max(...visibleAttempts.map((a) => a.score))}/
                        {activeQ?.max_points ?? 10}
                      </span>
                    )}
                    <p className="text-sm text-zinc-200 truncate">
                      {activeQ?.prompt || "Session complete."}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-3 shrink-0">
                    <span className="text-xs text-zinc-500">
                      <span className="text-orange-400 font-bold">
                        {session.points_earned}
                      </span>{" "}
                      pts
                    </span>
                  </div>
                </div>
                {activeQ && activeQ.prompt.length > 80 && (
                  <p className="mt-2 text-sm text-zinc-300 leading-relaxed">
                    {activeQ.prompt}
                  </p>
                )}
              </div>

              {/* Monaco Editor */}
              <div className="flex-1 min-h-0">
                <MonacoEditor
                  height="100%"
                  theme="vs-dark"
                  language={lang}
                  value={editorCode}
                  onChange={(v: string | undefined) =>
                    setEditorCode(v || "")
                  }
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    automaticLayout: true,
                    scrollBeyondLastLine: false,
                    readOnly:
                      !activeQ || session.status === "completed",
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
                  {error && (
                    <span className="text-xs text-red-400">{error}</span>
                  )}
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
                            <p className="text-xs text-zinc-300">
                              {a.llm_feedback}
                            </p>
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
                    disabled={
                      !activeQ ||
                      submitting ||
                      session.status === "completed"
                    }
                    className="px-5 py-2 bg-orange-500 text-black rounded font-semibold text-sm hover:bg-orange-400 disabled:opacity-50 transition-colors"
                  >
                    {submitting ? "Running..." : "Run & Submit"}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* ── Theory slide-over with Markdown rendering ─── */}
          {theoryOpen && session && (
            <div className="absolute inset-0 z-40 flex">
              <div
                className="absolute inset-0 bg-black/50"
                onClick={() => setTheoryOpen(false)}
              />
              <div className="relative ml-auto w-[48rem] max-w-[85%] h-full bg-zinc-900 border-l border-zinc-700 shadow-2xl flex flex-col">
                <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800">
                  <h3 className="font-semibold text-zinc-100">
                    Theory — {session.topic_id}
                  </h3>
                  <button
                    onClick={() => setTheoryOpen(false)}
                    className="text-zinc-400 hover:text-zinc-100 text-lg"
                  >
                    ✕
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto px-6 py-5 thin-scrollbar">
                  <div className="prose prose-base prose-invert max-w-none prose-headings:text-orange-400 prose-headings:border-b prose-headings:border-zinc-800 prose-headings:pb-2 prose-a:text-orange-400 prose-strong:text-zinc-100 prose-code:text-orange-300 prose-code:bg-zinc-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-pre:bg-zinc-950 prose-pre:border prose-pre:border-zinc-800 prose-pre:rounded-lg prose-li:marker:text-orange-400/60 prose-p:leading-relaxed">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {session.theory_content ||
                        streamingTheory ||
                        "No theory generated."}
                    </ReactMarkdown>
                    <div ref={theoryEndRef} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
