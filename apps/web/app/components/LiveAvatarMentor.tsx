"use client";

import {
  useEffect,
  useRef,
  useState,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import {
  LiveAvatarSession,
  SessionState,
  SessionEvent,
  AgentEventsEnum,
  VoiceChatEvent,
  VoiceChatState,
} from "@heygen/liveavatar-web-sdk";

/* ─── Public handle for parent to call message() ──────────────────────────── */

export interface LiveAvatarMentorHandle {
  /** Send text to the avatar AI — it will speak the response. */
  sendMessage: (text: string) => void;
  /** Make the avatar speak arbitrary text verbatim (no AI). */
  repeat: (text: string) => void;
  /** Interrupt avatar mid-speech. */
  interrupt: () => void;
  /** Whether the SDK session is connected and stream is ready. */
  isReady: boolean;
}

/* ─── Props ──────────────────────────────────────────────────────────────── */

interface Props {
  /** HeyGen session token obtained from backend. */
  sessionToken: string;
  /** Callback when the avatar session disconnects (e.g. timeout). */
  onDisconnected?: () => void;
  /** Real-time transcript events piped to parent for chat display. */
  onUserTranscript?: (text: string) => void;
  onAvatarTranscript?: (text: string) => void;
  /** Talking state updates. */
  onAvatarTalkingChange?: (talking: boolean) => void;
  onUserTalkingChange?: (talking: boolean) => void;
}

/* ─── Component ─────────────────────────────────────────────────────────── */

const LiveAvatarMentor = forwardRef<LiveAvatarMentorHandle, Props>(
  (
    {
      sessionToken,
      onDisconnected,
      onUserTranscript,
      onAvatarTranscript,
      onAvatarTalkingChange,
      onUserTalkingChange,
    },
    ref
  ) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const sessionRef = useRef<LiveAvatarSession | null>(null);

    const [sessionState, setSessionState] = useState<SessionState>(
      SessionState.INACTIVE
    );
    const [isStreamReady, setIsStreamReady] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [voiceChatActive, setVoiceChatActive] = useState(false);
    const [voiceChatEnabled, setVoiceChatEnabled] = useState(false);
    const [voiceChatLoading, setVoiceChatLoading] = useState(false);
    const [isAvatarTalking, setIsAvatarTalking] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const hasMediaDevices =
      typeof navigator !== "undefined" &&
      !!navigator.mediaDevices?.getUserMedia;

    /* ── Keep refs for latest state (avoids stale handle) ───────── */
    const sessionStateRef = useRef(sessionState);
    sessionStateRef.current = sessionState;
    const isStreamReadyRef = useRef(isStreamReady);
    isStreamReadyRef.current = isStreamReady;

    /* ── Expose handle to parent ─────────────────────────────────── */
    useImperativeHandle(
      ref,
      () => ({
        sendMessage: (text: string) => {
          sessionRef.current?.message(text);
        },
        repeat: (text: string) => {
          sessionRef.current?.repeat(text);
        },
        interrupt: () => {
          sessionRef.current?.interrupt();
        },
        get isReady() {
          return (
            sessionStateRef.current === SessionState.CONNECTED &&
            isStreamReadyRef.current
          );
        },
      }),
      [sessionState, isStreamReady]
    );

    /* ── Initialise & start session ──────────────────────────────── */
    useEffect(() => {
      if (!sessionToken) return;

      // Start WITHOUT voiceChat — user can enable mic after connection
      const session = new LiveAvatarSession(sessionToken, {
        voiceChat: false,
      });
      sessionRef.current = session;

      /* Session lifecycle */
      session.on(SessionEvent.SESSION_STATE_CHANGED, (state: any) => {
        setSessionState(state);
        if (state === SessionState.DISCONNECTED) {
          onDisconnected?.();
        }
      });
      session.on(SessionEvent.SESSION_STREAM_READY, () => {
        setIsStreamReady(true);
        // Attach video once stream is ready
        if (videoRef.current) {
          session.attach(videoRef.current);
        }
      });

      /* Voice chat state listeners (will fire once voice chat is enabled) */
      if (session.voiceChat) {
        session.voiceChat.on(VoiceChatEvent.MUTED, () => setIsMuted(true));
        session.voiceChat.on(VoiceChatEvent.UNMUTED, () => setIsMuted(false));
        session.voiceChat.on(VoiceChatEvent.STATE_CHANGED, (state: any) => {
          setVoiceChatActive(state === VoiceChatState.ACTIVE);
        });
      }

      /* Talking state */
      session.on(AgentEventsEnum.AVATAR_SPEAK_STARTED, () => {
        setIsAvatarTalking(true);
        onAvatarTalkingChange?.(true);
      });
      session.on(AgentEventsEnum.AVATAR_SPEAK_ENDED, () => {
        setIsAvatarTalking(false);
        onAvatarTalkingChange?.(false);
      });
      session.on(AgentEventsEnum.USER_SPEAK_STARTED, () => {
        onUserTalkingChange?.(true);
      });
      session.on(AgentEventsEnum.USER_SPEAK_ENDED, () => {
        onUserTalkingChange?.(false);
      });

      /* Transcriptions */
      session.on(AgentEventsEnum.USER_TRANSCRIPTION, (evt: any) => {
        onUserTranscript?.(evt.text);
      });
      session.on(AgentEventsEnum.AVATAR_TRANSCRIPTION, (evt: any) => {
        onAvatarTranscript?.(evt.text);
      });

      /* Auto-start */
      session
        .start()
        .catch((err: any) =>
          setError(err?.message || "Failed to start avatar session")
        );

      /* Keep-alive every 60s */
      const keepAlive = setInterval(() => {
        if (session.state === SessionState.CONNECTED) {
          session.keepAlive().catch(() => {});
        }
      }, 60_000);

      return () => {
        clearInterval(keepAlive);
        if (
          session.state === SessionState.CONNECTED ||
          session.state === SessionState.CONNECTING
        ) {
          session.stop().catch(() => {});
        }
        session.removeAllListeners();
        if (session.voiceChat) session.voiceChat.removeAllListeners();
        sessionRef.current = null;
      };
      // Only run once per token
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sessionToken]);

    /* ── Enable voice chat on demand ─────────────────────────────── */
    const enableVoiceChat = useCallback(async () => {
      if (!sessionRef.current?.voiceChat || voiceChatEnabled) return;
      setVoiceChatLoading(true);
      setError(null);
      try {
        // Check for an actual audio input device first
        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasMic = devices.some((d) => d.kind === "audioinput");
        if (!hasMic) {
          setError("No microphone found");
          return;
        }
        await sessionRef.current.voiceChat.start();
        setVoiceChatEnabled(true);
      } catch (err: any) {
        const msg = err?.message || String(err);
        if (msg.includes("NotAllowedError") || msg.includes("Permission")) {
          setError("Mic permission denied");
        } else if (msg.includes("NotFoundError") || msg.includes("device")) {
          setError("No microphone found");
        } else {
          setError("Failed to enable mic: " + msg);
        }
      } finally {
        setVoiceChatLoading(false);
      }
    }, [voiceChatEnabled]);

    /* ── Voice controls ──────────────────────────────────────────── */
    const toggleMute = useCallback(async () => {
      if (!sessionRef.current?.voiceChat) return;
      if (isMuted) {
        await sessionRef.current.voiceChat.unmute();
      } else {
        await sessionRef.current.voiceChat.mute();
      }
    }, [isMuted]);

    /* ── Render ──────────────────────────────────────────────────── */
    const connected = sessionState === SessionState.CONNECTED;
    const connecting = sessionState === SessionState.CONNECTING;

    return (
      <div className="flex flex-col items-center gap-2 w-full">
        {/* Video */}
        <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden border border-zinc-800">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-contain"
          />

          {/* Overlay states */}
          {connecting && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70">
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-zinc-400">
                  Connecting avatar...
                </span>
              </div>
            </div>
          )}

          {!connected && !connecting && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70">
              <span className="text-xs text-zinc-500">Avatar offline</span>
            </div>
          )}

          {/* Talking indicator */}
          {isAvatarTalking && connected && (
            <div className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-black/60 px-2 py-1 rounded-full">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-[10px] text-green-300">Speaking</span>
            </div>
          )}
        </div>

        {/* Controls */}
        {connected && (
          <div className="flex items-center gap-2 w-full">
            {hasMediaDevices && !voiceChatEnabled && (
              <button
                onClick={enableVoiceChat}
                disabled={voiceChatLoading}
                className="flex-1 text-xs py-1.5 rounded border border-zinc-700 bg-zinc-800 text-zinc-300 hover:border-orange-500 transition-colors disabled:opacity-50"
              >
                {voiceChatLoading ? "Enabling..." : "🎙️ Enable Mic"}
              </button>
            )}
            {hasMediaDevices && voiceChatEnabled && (
              <button
                onClick={toggleMute}
                className={`flex-1 text-xs py-1.5 rounded border transition-colors ${
                  isMuted
                    ? "bg-red-500/15 border-red-500/30 text-red-400 hover:bg-red-500/25"
                    : "bg-green-500/15 border-green-500/30 text-green-400"
                }`}
              >
                {isMuted ? "🔇 Unmute Mic" : "🎙️ Mic On"}
              </button>
            )}
            {!hasMediaDevices && (
              <span className="flex-1 text-[10px] text-zinc-500 text-center">
                🎙️ Mic unavailable (needs HTTPS)
              </span>
            )}
            <button
              onClick={() => sessionRef.current?.interrupt()}
              className="flex-1 text-xs py-1.5 rounded border border-zinc-700 bg-zinc-800 text-zinc-300 hover:border-orange-500 transition-colors"
            >
              ✋ Interrupt
            </button>
          </div>
        )}

        {error && (
          <p className="text-[10px] text-red-400 text-center">{error}</p>
        )}
      </div>
    );
  }
);

LiveAvatarMentor.displayName = "LiveAvatarMentor";

export default LiveAvatarMentor;
