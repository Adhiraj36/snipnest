// Re-export from env – kept for backward compatibility
import 'dotenv/config';

export const SECRET = process.env.JWT_SECRET || '';
export const CLERK_API_KEY = process.env.CLERK_SECRET_KEY || '';