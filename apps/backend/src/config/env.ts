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
