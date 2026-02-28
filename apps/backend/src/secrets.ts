// Re-export from the central env module for backward compatibility
import { JWT_SECRET, CLERK_SECRET_KEY } from './config/env';

export const SECRET = JWT_SECRET;
export const CLERK_API_KEY = CLERK_SECRET_KEY;