import { and, asc, desc, eq, sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import type {
  InterestDomain,
  MentorDifficulty,
  MentorQuestion,
  MentorQuestionType,
  MentorSession,
  QuestionAttempt,
} from '@repo/shared-types';
import db from '../../db/index';
import { mentorQuestions, mentorSessions, questionAttempts } from '../../db/schema';
import { callLLM } from './llm';
import { executeJudge0 } from './judge0';
import { findCatalogPath, INTEREST_CATALOG } from '../config/catalog';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type StartSessionPayload = {
  interestId: string;
  subDomainId: string;
  topicId: string;
  questionCount?: number;
};

export type SubmissionPayload = {
  sessionId: string;
  questionId: string;
  submittedCode: string;
  languageId?: number;
};

type GeneratedQuestion = {
  prompt: string;
  starterCode: string;
  testInput: string;
  expectedOutput: string;
  explanation: string;
  difficulty: MentorDifficulty;
  questionType: MentorQuestionType;
  maxPoints: number;
};

// ---------------------------------------------------------------------------
// Theory generation
// ---------------------------------------------------------------------------

async function generateTheory(interest: InterestDomain, subDomainName: string, topicName: string) {
  const llmTheory = await callLLM(
    'theory',
    `Write concise theory for ${interest.name} > ${subDomainName} > ${topicName}.\n` +
      'Output markdown with sections: What it is, Why it matters, Common patterns, Mistakes to avoid, Mini checklist.',
  );

  if (llmTheory && llmTheory.trim().length > 0) return llmTheory;

  return (
    `## ${topicName}\n\n### What it is\n${topicName} is a core concept in ${subDomainName}.\n\n` +
    `### Why it matters\nIt helps you write cleaner solutions and improve interview readiness.\n\n` +
    `### Common patterns\n- Break the problem into input, processing, output\n- Handle edge cases early\n- Validate with small examples\n\n` +
    `### Mistakes to avoid\n- Ignoring constraints\n- Hardcoding assumptions\n- Skipping dry-runs\n\n` +
    `### Mini checklist\n- I understand the core idea\n- I can explain trade-offs\n- I can solve medium problems on this topic`
  );
}

// ---------------------------------------------------------------------------
// Question generation
// ---------------------------------------------------------------------------

function tryParseGeneratedQuestions(raw: string | null): GeneratedQuestion[] | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { questions?: GeneratedQuestion[] };
    if (!Array.isArray(parsed.questions)) return null;
    return parsed.questions;
  } catch {
    return null;
  }
}

function fallbackStarterCode(language: string): string {
  if (language === 'python') {
    return 'def solve():\n    pass\n\nif __name__ == "__main__":\n    solve()\n';
  }
  if (language === 'cpp') {
    return '#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n  ios::sync_with_stdio(false);\n  cin.tie(nullptr);\n\n  return 0;\n}\n';
  }
  return 'function solve(input) {\n  return "";\n}\n\nconst fs = require("fs");\nconst input = fs.readFileSync(0, "utf8");\nprocess.stdout.write(String(solve(input)));\n';
}

async function generateQuestions(
  interest: InterestDomain,
  subDomainName: string,
  topicName: string,
  questionCount: number,
): Promise<GeneratedQuestion[]> {
  const llmRaw = await callLLM(
    'question',
    `Generate ${questionCount} coding questions for ${interest.name} > ${subDomainName} > ${topicName}.\n` +
      'Return STRICT JSON only in this shape: ' +
      '{"questions":[{"prompt":"","starterCode":"","testInput":"","expectedOutput":"","explanation":"","difficulty":"easy|medium|hard","questionType":"code","maxPoints":10}]}.',
  );

  const parsed = tryParseGeneratedQuestions(llmRaw);
  if (parsed && parsed.length > 0) {
    return parsed.slice(0, questionCount).map((item) => ({
      prompt: item.prompt || `${topicName}: Solve the required task.`,
      starterCode: item.starterCode || '',
      testInput: item.testInput || '',
      expectedOutput: item.expectedOutput || '',
      explanation: item.explanation || '',
      difficulty: item.difficulty || 'easy',
      questionType: item.questionType || 'code',
      maxPoints: typeof item.maxPoints === 'number' ? item.maxPoints : 10,
    }));
  }

  // Deterministic fallback when LLM is unavailable
  return Array.from({ length: questionCount }).map((_, idx) => ({
    prompt: `Q${idx + 1}. ${topicName}: Read input and produce the expected output using ${interest.name} fundamentals.`,
    starterCode: fallbackStarterCode(interest.language),
    testInput: `${idx + 2}`,
    expectedOutput: `${idx + 2}`,
    explanation: `Use core ${topicName} patterns and handle edge cases.`,
    difficulty: (idx < 2 ? 'easy' : idx < 4 ? 'medium' : 'hard') as MentorDifficulty,
    questionType: 'code' as MentorQuestionType,
    maxPoints: 10,
  }));
}

// ---------------------------------------------------------------------------
// LLM scoring
// ---------------------------------------------------------------------------

async function llmScoreAttempt(input: {
  prompt: string;
  expectedOutput: string;
  judgeStatus: string;
  stdout: string;
  stderr: string;
  submittedCode: string;
  maxPoints: number;
}) {
  const llmRaw = await callLLM(
    'scoring',
    'Score this coding attempt. Return STRICT JSON only: {"score": number, "feedback": string}.\n' +
      `Prompt: ${input.prompt}\nExpected output: ${input.expectedOutput}\n` +
      `Judge status: ${input.judgeStatus}\nstdout: ${input.stdout}\nstderr: ${input.stderr}\n` +
      `Submitted code:\n${input.submittedCode}\nMax points: ${input.maxPoints}`,
  );

  if (llmRaw) {
    try {
      const parsed = JSON.parse(llmRaw) as { score?: number; feedback?: string };
      const bounded = Math.max(0, Math.min(input.maxPoints, Number(parsed.score ?? 0)));
      return {
        score: Number.isFinite(bounded) ? Math.round(bounded) : 0,
        feedback: parsed.feedback || 'Keep iterating and compare expected vs actual output.',
      };
    } catch {
      return { score: 0, feedback: 'Try to align your output with expected output and handle constraints carefully.' };
    }
  }

  return {
    score: 0,
    feedback: input.stderr.length > 0
      ? `Runtime/compile issue: ${input.stderr}`
      : 'Output does not match expected output. Re-check logic and edge cases.',
  };
}

// ---------------------------------------------------------------------------
// Public service methods
// ---------------------------------------------------------------------------

export async function startSession(userId: string, payload: StartSessionPayload) {
  const catalog = findCatalogPath(payload.interestId, payload.subDomainId, payload.topicId);
  if (!catalog) {
    return { success: false as const, error: 'Invalid interest, sub-domain, or topic' };
  }

  const questionCount = Math.max(5, Math.min(10, payload.questionCount ?? 5));
  const sessionId = nanoid();

  const theory = await generateTheory(catalog.interest, catalog.subDomain.name, catalog.topic.name);
  const generated = await generateQuestions(catalog.interest, catalog.subDomain.name, catalog.topic.name, questionCount);

  const sessionRecord: MentorSession = {
    id: sessionId,
    user_id: userId,
    interest_id: catalog.interest.id,
    sub_domain_id: catalog.subDomain.id,
    topic_id: catalog.topic.id,
    theory_content: theory,
    current_question_index: 0,
    points_earned: 0,
    status: 'active',
    created_at: new Date(),
    updated_at: new Date(),
  };

  await db.insert(mentorSessions).values(sessionRecord);

  const questionRecords: MentorQuestion[] = generated.map((q, idx) => ({
    id: nanoid(),
    session_id: sessionId,
    user_id: userId,
    interest_id: catalog.interest.id,
    sub_domain_id: catalog.subDomain.id,
    topic_id: catalog.topic.id,
    question_index: idx,
    prompt: q.prompt,
    starter_code: q.starterCode,
    test_input: q.testInput,
    expected_output: q.expectedOutput,
    explanation: q.explanation,
    difficulty: q.difficulty,
    question_type: q.questionType,
    max_points: q.maxPoints,
    created_at: new Date(),
  }));

  if (questionRecords.length > 0) {
    await db.insert(mentorQuestions).values(questionRecords);

    // Seed "generated" placeholder attempts so every question counts
    const seedAttempts: QuestionAttempt[] = questionRecords.map((qr) => ({
      id: nanoid(),
      question_id: qr.id,
      session_id: sessionId,
      user_id: userId,
      submitted_code: '',
      judge0_status: 'generated',
      stdout: '',
      stderr: '',
      score: 0,
      llm_feedback: 'Question generated and ready for attempt.',
      created_at: new Date(),
    }));
    await db.insert(questionAttempts).values(seedAttempts);
  }

  return {
    success: true as const,
    data: {
      session: sessionRecord,
      questions: questionRecords,
      interest: catalog.interest,
      subDomain: catalog.subDomain,
      topic: catalog.topic,
    },
  };
}

export async function getSessionDetails(userId: string, sessionId: string) {
  const session = await db
    .select()
    .from(mentorSessions)
    .where(and(eq(mentorSessions.id, sessionId), eq(mentorSessions.user_id, userId)));

  if (!session[0]) return null;

  const questions = await db
    .select()
    .from(mentorQuestions)
    .where(eq(mentorQuestions.session_id, sessionId))
    .orderBy(asc(mentorQuestions.question_index));

  return { session: session[0], questions };
}

export async function getSessionAttempts(userId: string, sessionId: string, questionId?: string) {
  const session = await db
    .select()
    .from(mentorSessions)
    .where(and(eq(mentorSessions.id, sessionId), eq(mentorSessions.user_id, userId)));

  if (!session[0]) return null;

  const conditions = questionId
    ? and(eq(questionAttempts.session_id, sessionId), eq(questionAttempts.user_id, userId), eq(questionAttempts.question_id, questionId))
    : and(eq(questionAttempts.session_id, sessionId), eq(questionAttempts.user_id, userId));

  return db.select().from(questionAttempts).where(conditions).orderBy(desc(questionAttempts.created_at));
}

export async function submitAnswer(userId: string, payload: SubmissionPayload) {
  const session = await db
    .select()
    .from(mentorSessions)
    .where(and(eq(mentorSessions.id, payload.sessionId), eq(mentorSessions.user_id, userId)));

  if (!session[0]) return { success: false as const, error: 'Session not found' };

  const question = await db
    .select()
    .from(mentorQuestions)
    .where(and(
      eq(mentorQuestions.id, payload.questionId),
      eq(mentorQuestions.session_id, payload.sessionId),
      eq(mentorQuestions.user_id, userId),
    ));

  if (!question[0]) return { success: false as const, error: 'Question not found' };

  const interest = INTEREST_CATALOG.find((i) => i.id === question[0].interest_id);
  const languageId = payload.languageId ?? interest?.judge0LanguageId ?? 63;

  // Execute on Judge0
  const judge = await executeJudge0(
    payload.submittedCode,
    languageId,
    question[0].test_input,
    question[0].expected_output,
  );

  const accepted = judge.judgeStatus.toLowerCase().includes('accepted');

  // Check if user already got points for this question
  const priorAccepted = await db
    .select({ count: sql<number>`count(*)` })
    .from(questionAttempts)
    .where(and(
      eq(questionAttempts.question_id, payload.questionId),
      eq(questionAttempts.user_id, userId),
      eq(questionAttempts.judge0_status, 'Accepted'),
    ));
  const alreadyGotPoints = Number(priorAccepted[0]?.count ?? 0) > 0;

  // Score via LLM if not accepted
  let score = 0;
  let feedback = accepted
    ? 'Great job. Your solution passed the judge checks.'
    : 'Try again with improved logic and output handling.';

  if (accepted) {
    score = question[0].max_points;
  } else {
    const llmScore = await llmScoreAttempt({
      prompt: question[0].prompt,
      expectedOutput: question[0].expected_output,
      judgeStatus: judge.judgeStatus,
      stdout: judge.stdout,
      stderr: judge.stderr,
      submittedCode: payload.submittedCode,
      maxPoints: question[0].max_points,
    });
    score = llmScore.score;
    feedback = llmScore.feedback;
  }

  const pointsToAdd = alreadyGotPoints ? 0 : score;

  // Persist attempt
  const attempt: QuestionAttempt = {
    id: nanoid(),
    question_id: payload.questionId,
    session_id: payload.sessionId,
    user_id: userId,
    submitted_code: payload.submittedCode,
    judge0_status: judge.judgeStatus,
    stdout: judge.stdout,
    stderr: judge.stderr,
    score,
    llm_feedback: feedback,
    created_at: new Date(),
  };
  await db.insert(questionAttempts).values(attempt);

  // Advance session
  const allQuestions = await db
    .select()
    .from(mentorQuestions)
    .where(eq(mentorQuestions.session_id, payload.sessionId))
    .orderBy(asc(mentorQuestions.question_index));

  const qIndex = allQuestions.find((q) => q.id === payload.questionId)?.question_index ?? 0;
  const nextIndex = accepted ? Math.max(session[0].current_question_index, qIndex + 1) : session[0].current_question_index;
  const completed = nextIndex >= allQuestions.length;

  await db.update(mentorSessions).set({
    current_question_index: nextIndex,
    points_earned: session[0].points_earned + pointsToAdd,
    status: completed ? 'completed' : 'active',
    updated_at: new Date(),
  }).where(eq(mentorSessions.id, payload.sessionId));

  return {
    success: true as const,
    data: { attempt, accepted, pointsAwarded: pointsToAdd, nextQuestionIndex: nextIndex, completed },
  };
}

export async function getUserStats(userId: string) {
  const sessions = await db.select().from(mentorSessions).where(eq(mentorSessions.user_id, userId));
  return {
    totalPoints: sessions.reduce((sum, s) => sum + s.points_earned, 0),
    sessionsStarted: sessions.length,
    sessionsCompleted: sessions.filter((s) => s.status === 'completed').length,
  };
}

export async function getQuestionBestScore(userId: string, questionId: string) {
  const result = await db
    .select({ best: sql<number>`max(${questionAttempts.score})` })
    .from(questionAttempts)
    .where(and(eq(questionAttempts.question_id, questionId), eq(questionAttempts.user_id, userId)));
  return result[0]?.best ?? 0;
}
