"use client"
import axios from "axios";
import type { InterestDomain, MentorQuestion, MentorSession, Notes, QuestionAttempt } from "@repo/shared-types";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:9000"

const getBackendURL = () => {
    return BACKEND_URL;
};

const api = axios.create({
    baseURL: getBackendURL(),
    headers: {
        "Content-Type": "application/json",
    },
});

type ApiResult<T> =
    | { success: true; data: T }
    | { success: false; error: string };

export async function getMe(token: string): Promise<ApiResult<any>> {
    try {
        const resp = await api.get("/users/me", {
            headers: { Authorization: `Bearer ${token}` },
        });
        console.log(resp)
        return { success: true, data: resp.data };
    } catch (err: any) {
        console.error(err);
        return { success: false, error: err?.message || String(err) };
    }
}

export async function postUserNote(
    token: string,
    title: string,
    content: string
): Promise<ApiResult<{ success: boolean }>> {
    try {
        const resp = await api.post(
            "/notes",
            { title, content },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return { success: true, data: resp.data };
    } catch (err: any) {
        console.error(err);
        return { success: false, error: err?.message || String(err) };
    }
}

export async function getUserNotes(token: string): Promise<ApiResult<Notes[]>> {
    try {
        const resp = await api.get("/notes", {
            headers: { Authorization: `Bearer ${token}` },
        });
        return { success: true, data: resp.data as Notes[] };
    } catch (err: any) {
        console.error(err);
        return { success: false, error: err?.message || String(err) };
    }
}

export type MentorSessionResponse = {
    session: MentorSession;
    questions: MentorQuestion[];
    interest: InterestDomain;
    subDomain: { id: string; name: string };
    topic: { id: string; name: string };
};

export type MentorStats = {
    totalPoints: number;
    sessionsStarted: number;
    sessionsCompleted: number;
};

export async function getMentorCatalog(token: string): Promise<ApiResult<InterestDomain[]>> {
    try {
        const resp = await api.get("/mentor/catalog", {
            headers: { Authorization: `Bearer ${token}` },
        });
        return { success: true, data: resp.data as InterestDomain[] };
    } catch (err: any) {
        console.error(err);
        return { success: false, error: err?.message || String(err) };
    }
}

export async function startMentorSession(
    token: string,
    payload: { interestId: string; subDomainId: string; topicId: string; questionCount?: number }
): Promise<ApiResult<MentorSessionResponse>> {
    try {
        const resp = await api.post("/mentor/session/start", payload, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return { success: true, data: resp.data as MentorSessionResponse };
    } catch (err: any) {
        console.error(err);
        return { success: false, error: err?.message || String(err) };
    }
}

export async function getMentorSession(
    token: string,
    sessionId: string
): Promise<ApiResult<{ session: MentorSession; questions: MentorQuestion[] }>> {
    try {
        const resp = await api.get(`/mentor/session/${sessionId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return { success: true, data: resp.data as { session: MentorSession; questions: MentorQuestion[] } };
    } catch (err: any) {
        console.error(err);
        return { success: false, error: err?.message || String(err) };
    }
}

export async function submitMentorAttempt(
    token: string,
    sessionId: string,
    payload: { questionId: string; submittedCode: string; languageId?: number }
): Promise<ApiResult<{ attempt: QuestionAttempt; accepted: boolean; pointsAwarded: number; nextQuestionIndex: number; completed: boolean }>> {
    try {
        const resp = await api.post(`/mentor/session/${sessionId}/submit`, payload, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return {
            success: true,
            data: resp.data as {
                attempt: QuestionAttempt;
                accepted: boolean;
                pointsAwarded: number;
                nextQuestionIndex: number;
                completed: boolean;
            },
        };
    } catch (err: any) {
        console.error(err);
        return { success: false, error: err?.message || String(err) };
    }
}

export async function getMentorStats(token: string): Promise<ApiResult<MentorStats>> {
    try {
        const resp = await api.get(`/mentor/stats/me`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return { success: true, data: resp.data as MentorStats };
    } catch (err: any) {
        console.error(err);
        return { success: false, error: err?.message || String(err) };
    }
}

export type EnrichedSession = MentorSession & {
    questionCount: number;
    acceptedCount: number;
};

export async function getMentorSessions(token: string): Promise<ApiResult<EnrichedSession[]>> {
    try {
        const resp = await api.get("/mentor/sessions/me", {
            headers: { Authorization: `Bearer ${token}` },
        });
        return { success: true, data: resp.data as EnrichedSession[] };
    } catch (err: any) {
        console.error(err);
        return { success: false, error: err?.message || String(err) };
    }
}

export async function deleteMentorSession(
    token: string,
    sessionId: string
): Promise<ApiResult<{ success: boolean }>> {
    try {
        const resp = await api.delete(`/mentor/session/${sessionId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return { success: true, data: resp.data as { success: boolean } };
    } catch (err: any) {
        console.error(err);
        return { success: false, error: err?.message || String(err) };
    }
}

export async function getMentorAttempts(
    token: string,
    sessionId: string,
    questionId?: string
): Promise<ApiResult<QuestionAttempt[]>> {
    try {
        const query = questionId ? `?questionId=${encodeURIComponent(questionId)}` : "";
        const resp = await api.get(`/mentor/session/${sessionId}/attempts${query}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return { success: true, data: resp.data as QuestionAttempt[] };
    } catch (err: any) {
        console.error(err);
        return { success: false, error: err?.message || String(err) };
    }
}

// ---------------------------------------------------------------------------
// SSE: stream session start with live theory/question chunks
// ---------------------------------------------------------------------------

export type StreamSessionCallbacks = {
    onTheoryChunk?: (chunk: string) => void;
    onQuestionChunk?: (chunk: string) => void;
    onStatus?: (phase: string, message: string) => void;
    onSessionReady?: (data: MentorSessionResponse) => void;
    onError?: (message: string) => void;
    onDone?: () => void;
};

export async function startMentorSessionStream(
    token: string,
    payload: { interestId: string; subDomainId: string; topicId: string; questionCount?: number },
    callbacks: StreamSessionCallbacks,
): Promise<void> {
    const url = `${BACKEND_URL}/mentor/session/start-stream`;

    const resp = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
    });

    if (!resp.ok || !resp.body) {
        callbacks.onError?.("Stream request failed");
        return;
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        let currentEvent = "message";
        for (const line of lines) {
            if (line.startsWith("event: ")) {
                currentEvent = line.slice(7).trim();
            } else if (line.startsWith("data: ")) {
                const raw = line.slice(6);
                try {
                    const data = JSON.parse(raw);
                    switch (currentEvent) {
                        case "theory-chunk":
                            callbacks.onTheoryChunk?.(data.chunk);
                            break;
                        case "question-chunk":
                            callbacks.onQuestionChunk?.(data.chunk);
                            break;
                        case "status":
                            callbacks.onStatus?.(data.phase, data.message);
                            break;
                        case "session-ready":
                            callbacks.onSessionReady?.(data as MentorSessionResponse);
                            break;
                        case "error":
                            callbacks.onError?.(data.message);
                            break;
                        case "done":
                            callbacks.onDone?.();
                            break;
                    }
                } catch {
                    // skip unparseable
                }
                currentEvent = "message";
            }
        }
    }

    callbacks.onDone?.();
}

// ---------------------------------------------------------------------------
// SSE: avatar mentor chat (streaming)
// ---------------------------------------------------------------------------

export type AvatarChatMessage = { role: "user" | "assistant" | "system"; content: string };

export async function streamAvatarChat(
    token: string,
    history: AvatarChatMessage[],
    context: string,
    onChunk: (chunk: string) => void,
    onDone: (full: string) => void,
    onError?: (msg: string) => void,
): Promise<void> {
    const url = `${BACKEND_URL}/mentor/avatar/chat`;

    const resp = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ history, context }),
    });

    if (!resp.ok || !resp.body) {
        onError?.("Avatar chat request failed");
        return;
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        let currentEvent = "message";
        for (const line of lines) {
            if (line.startsWith("event: ")) {
                currentEvent = line.slice(7).trim();
            } else if (line.startsWith("data: ")) {
                const raw = line.slice(6);
                try {
                    const data = JSON.parse(raw);
                    if (currentEvent === "done") {
                        onDone(data.content || "");
                    } else if (currentEvent === "error") {
                        onError?.(data.message);
                    } else {
                        if (data.chunk) onChunk(data.chunk);
                    }
                } catch {
                    // skip
                }
                currentEvent = "message";
            }
        }
    }
}

// ---------------------------------------------------------------------------
// Avatar (HeyGen LiveAvatar)
// ---------------------------------------------------------------------------

export async function getAvatarConfig(token: string): Promise<ApiResult<{ available: boolean; isSandbox: boolean }>> {
    try {
        const resp = await api.get('/avatar/config', {
            headers: { Authorization: `Bearer ${token}` },
        });
        return { success: true, data: resp.data as { available: boolean; isSandbox: boolean } };
    } catch (err: any) {
        return { success: false, error: err?.message || String(err) };
    }
}

export async function getAvatarSessionToken(
    token: string,
    opts?: { pushToTalk?: boolean }
): Promise<ApiResult<{ session_token: string; session_id: string }>> {
    try {
        const resp = await api.post('/avatar/session-token', opts || {}, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return { success: true, data: resp.data as { session_token: string; session_id: string } };
    } catch (err: any) {
        return { success: false, error: err?.response?.data?.error || err?.message || String(err) };
    }
}

export async function stopAvatarSession(
    token: string,
    sessionToken: string
): Promise<ApiResult<{ success: boolean }>> {
    try {
        const resp = await api.post('/avatar/stop', { session_token: sessionToken }, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return { success: true, data: resp.data as { success: boolean } };
    } catch (err: any) {
        return { success: false, error: err?.message || String(err) };
    }
}