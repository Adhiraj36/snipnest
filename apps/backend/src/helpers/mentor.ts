// -----------------------------------------------------------------------
// DEPRECATED – kept as a thin re-export shim for backwards compatibility.
// All logic now lives in  src/services/mentor.ts, src/services/llm.ts, etc.
// -----------------------------------------------------------------------
export {
  startSession as startMentorSession,
  getSessionDetails,
  getSessionAttempts,
  submitAnswer as submitMentorAnswer,
  getUserStats as getUserMentorStats,
} from '../services/mentor';

export { INTEREST_CATALOG } from '../config/catalog';
