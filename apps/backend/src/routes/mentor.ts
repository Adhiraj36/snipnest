import { Router } from 'express';
import verifyToken from '../middleware';
import { INTEREST_CATALOG, findCatalogPath } from '../config/catalog';
import {
  deleteSession,
  getSessionAttempts,
  getSessionDetails,
  getUserSessions,
  getUserStats,
  startSession,
  submitAnswer,
} from '../services/mentor';
import { streamLLM, streamAvatarChat, type AvatarMessage } from '../services/llm';

const router = Router();

// ---------- helpers ----------

function extractUserId(req: any): string | null {
  if (!req.verified || typeof req.verified === 'string' || !('id' in req.verified)) return null;
  return req.verified.id;
}

// ---------- routes ----------

router.get('/catalog', verifyToken, async (_req, res) => {
  const userId = extractUserId(_req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  return res.status(200).json(INTEREST_CATALOG);
});

router.post('/session/start', verifyToken, async (req, res) => {
  const userId = extractUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const result = await startSession(userId, {
    interestId: req.body.interestId,
    subDomainId: req.body.subDomainId,
    topicId: req.body.topicId,
    questionCount: req.body.questionCount,
  });

  if (!result.success) return res.status(400).json({ error: result.error });
  return res.status(201).json(result.data);
});

// ---------- SSE: stream session start (theory + questions generated live) ----------

router.post('/session/start-stream', verifyToken, async (req, res) => {
  const userId = extractUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const { interestId, subDomainId, topicId, questionCount } = req.body;
  const catalog = findCatalogPath(interestId, subDomainId, topicId);
  if (!catalog) return res.status(400).json({ error: 'Invalid interest path' });

  // SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const send = (event: string, data: any) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    // 1. Stream theory
    send('status', { phase: 'theory', message: 'Generating theory...' });
    let theoryContent = '';
    const theoryPrompt =
      `Write concise theory for ${catalog.interest.name} > ${catalog.subDomain.name} > ${catalog.topic.name}.\n` +
      'Output markdown with sections: What it is, Why it matters, Common patterns, Mistakes to avoid, Mini checklist.';

    for await (const chunk of streamLLM('theory', theoryPrompt)) {
      theoryContent += chunk;
      send('theory-chunk', { chunk });
    }

    if (!theoryContent.trim()) {
      theoryContent =
        `## ${catalog.topic.name}\n\n### What it is\n${catalog.topic.name} is a core concept in ${catalog.subDomain.name}.\n\n` +
        `### Why it matters\nIt helps you write cleaner solutions and improve interview readiness.`;
    }

    send('theory-done', { content: theoryContent });

    // 2. Stream questions
    send('status', { phase: 'questions', message: 'Generating questions...' });
    const count = Math.max(5, Math.min(10, questionCount ?? 5));
    let questionsContent = '';
    const qPrompt =
      `Generate ${count} coding questions for ${catalog.interest.name} > ${catalog.subDomain.name} > ${catalog.topic.name}.\n` +
      'Return STRICT JSON only in this shape: ' +
      '{"questions":[{"prompt":"","starterCode":"","testInput":"","expectedOutput":"","explanation":"","difficulty":"easy|medium|hard","questionType":"code","maxPoints":10}]}.';

    for await (const chunk of streamLLM('question', qPrompt)) {
      questionsContent += chunk;
      send('question-chunk', { chunk });
    }

    send('status', { phase: 'saving', message: 'Saving session...' });

    // 3. Save via the normal startSession (it also generates, but theory/questions are already done)
    const result = await startSession(userId, { interestId, subDomainId, topicId, questionCount: count });
    if (!result.success) {
      send('error', { message: result.error });
      return res.end();
    }

    send('session-ready', result.data);
    send('done', {});
  } catch (err: any) {
    send('error', { message: err?.message || 'Stream failed' });
  } finally {
    res.end();
  }
});

// ---------- SSE: avatar mentor chat ----------

router.post('/avatar/chat', verifyToken, async (req, res) => {
  const userId = extractUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const { history, context } = req.body as {
    history: AvatarMessage[];
    context: string;
  };

  if (!Array.isArray(history) || typeof context !== 'string') {
    return res.status(400).json({ error: 'history[] and context required' });
  }

  // SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  try {
    let full = '';
    for await (const chunk of streamAvatarChat(history, context)) {
      full += chunk;
      res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
    }
    res.write(`event: done\ndata: ${JSON.stringify({ content: full })}\n\n`);
  } catch (err: any) {
    res.write(`event: error\ndata: ${JSON.stringify({ message: err?.message || 'Chat failed' })}\n\n`);
  } finally {
    res.end();
  }
});

router.get('/session/:sessionId', verifyToken, async (req, res) => {
  const userId = extractUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const session = await getSessionDetails(userId, req.params.sessionId);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  return res.status(200).json(session);
});

router.get('/session/:sessionId/attempts', verifyToken, async (req, res) => {
  const userId = extractUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const questionId = typeof req.query.questionId === 'string' ? req.query.questionId : undefined;
  const attempts = await getSessionAttempts(userId, req.params.sessionId, questionId);
  if (!attempts) return res.status(404).json({ error: 'Session not found' });
  return res.status(200).json(attempts);
});

router.post('/session/:sessionId/submit', verifyToken, async (req, res) => {
  const userId = extractUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const result = await submitAnswer(userId, {
    sessionId: req.params.sessionId,
    questionId: req.body.questionId,
    submittedCode: req.body.submittedCode,
    languageId: req.body.languageId,
  });

  if (!result.success) return res.status(400).json({ error: result.error });
  return res.status(200).json(result.data);
});

router.delete('/session/:sessionId', verifyToken, async (req, res) => {
  const userId = extractUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const result = await deleteSession(userId, req.params.sessionId);
  if (!result.success) return res.status(404).json({ error: result.error });
  return res.status(200).json({ success: true });
});

router.get('/stats/me', verifyToken, async (req, res) => {
  const userId = extractUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const stats = await getUserStats(userId);
  return res.status(200).json(stats);
});

router.get('/sessions/me', verifyToken, async (req, res) => {
  const userId = extractUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const sessions = await getUserSessions(userId);
  return res.status(200).json(sessions);
});

export default router;
