import Together from 'together-ai';
import {
  LLM_BASE_URL,
  TOGETHER_API_KEY,
  THEORY_MODEL,
  QUESTION_MODEL,
  SCORING_MODEL,
} from '../config/env';

export type LLMTask = 'theory' | 'question' | 'scoring';

const together = new Together({
  apiKey: TOGETHER_API_KEY || undefined,
  ...(LLM_BASE_URL ? { baseURL: LLM_BASE_URL } : {}),
});

const MODEL_MAP: Record<LLMTask, string> = {
  theory: THEORY_MODEL,
  question: QUESTION_MODEL,
  scoring: SCORING_MODEL,
};

export async function callLLM(task: LLMTask, prompt: string): Promise<string | null> {
  if (!TOGETHER_API_KEY) return null;

  const model = MODEL_MAP[task];

  try {
    const completion = await together.chat.completions.create({
      model,
      temperature: task === 'scoring' ? 0.1 : 0.4,
      messages: [
        {
          role: 'system',
          content:
            'You are an AI coding mentor. Follow output format exactly and keep content concise, practical, and student-friendly.',
        },
        { role: 'user', content: prompt },
      ],
    });

    const content = completion.choices?.[0]?.message?.content;
    if (typeof content === 'string') return content;
    if (Array.isArray(content)) {
      return content
        .map((part) => (typeof part === 'string' ? part : 'text' in part ? part.text : ''))
        .join('');
    }
    return null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Streaming variant — yields delta chunks via an async generator
// ---------------------------------------------------------------------------

export async function* streamLLM(
  task: LLMTask,
  prompt: string,
): AsyncGenerator<string, void, unknown> {
  if (!TOGETHER_API_KEY) return;

  const model = MODEL_MAP[task];

  try {
    const stream = await together.chat.completions.create({
      model,
      temperature: task === 'scoring' ? 0.1 : 0.4,
      stream: true,
      messages: [
        {
          role: 'system',
          content:
            'You are an AI coding mentor. Follow output format exactly and keep content concise, practical, and student-friendly.',
        },
        { role: 'user', content: prompt },
      ],
    });

    for await (const chunk of stream) {
      const delta = chunk.choices?.[0]?.delta?.content;
      if (typeof delta === 'string' && delta.length > 0) {
        yield delta;
      }
    }
  } catch {
    // swallow — caller checks for empty stream
  }
}

// ---------------------------------------------------------------------------
// Avatar mentor chat — streaming, with conversation context
// ---------------------------------------------------------------------------

export type AvatarMessage = { role: 'user' | 'assistant' | 'system'; content: string };

const AVATAR_SYSTEM_PROMPT = `You are an AI coding mentor avatar. Your role:
- Explain theory concepts clearly and engagingly when discussing a topic.
- Guide students through solving coding questions step by step — give hints, ask leading questions, point out patterns.
- NEVER provide direct answers or complete code solutions. If a student asks for the answer, redirect them with hints.
- When reviewing code or an attempt, give a score out of the max points and constructive feedback.
- Be encouraging, conversational, and actively engage — ask follow-up questions to check understanding.
- Keep responses concise (2-4 sentences when possible) so the avatar speech feels natural.
- If the student is stuck, break the problem into smaller sub-problems and guide them through each.`;

export async function* streamAvatarChat(
  history: AvatarMessage[],
  context: string,
): AsyncGenerator<string, void, unknown> {
  if (!TOGETHER_API_KEY) return;

  const model = THEORY_MODEL;

  try {
    const messages = [
      { role: 'system' as const, content: AVATAR_SYSTEM_PROMPT + '\n\nCurrent session context:\n' + context },
      ...history.map((m) => ({ role: m.role, content: m.content })),
    ];

    const stream = await together.chat.completions.create({
      model,
      temperature: 0.5,
      stream: true,
      messages,
    });

    for await (const chunk of stream) {
      const delta = chunk.choices?.[0]?.delta?.content;
      if (typeof delta === 'string' && delta.length > 0) {
        yield delta;
      }
    }
  } catch {
    // swallow
  }
}
