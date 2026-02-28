import 'dotenv/config';

export const PORT = process.env.PORT || 9000;
export const DATABASE_URL = process.env.DATABASE_URL || '';
export const JUDGE0_URL = process.env.JUDGE0_URL || 'https://judge0-ce.p.rapidapi.com';
export const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || '';

export const LLM_BASE_URL = process.env.LLM_BASE_URL || '';
export const TOGETHER_API_KEY = process.env.TOGETHER_API_KEY || '';
export const THEORY_MODEL = process.env.LLM_MODEL_THEORY || 'openai/gpt-oss-20b';
export const QUESTION_MODEL = process.env.LLM_MODEL_QUESTION || 'openai/gpt-oss-20b';
export const SCORING_MODEL = process.env.LLM_MODEL_SCORING || 'openai/gpt-oss-20b';

// HeyGen LiveAvatar
export const HEYGEN_API_KEY = process.env.HEYGEN_API_KEY || '';
export const HEYGEN_API_URL = process.env.HEYGEN_API_URL || 'https://api.liveavatar.com';
export const HEYGEN_AVATAR_ID = process.env.HEYGEN_AVATAR_ID || '';
export const HEYGEN_VOICE_ID = process.env.HEYGEN_VOICE_ID || '';
export const HEYGEN_CONTEXT_ID = process.env.HEYGEN_CONTEXT_ID || '';
export const HEYGEN_IS_SANDBOX = process.env.HEYGEN_IS_SANDBOX !== 'false';

// Auth
export const JWT_SECRET = process.env.JWT_SECRET || '';
export const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY || '';
