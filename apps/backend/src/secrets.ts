// the JWT key from the Clerk template; store in env var in production
export const SECRET = process.env.CLERK_JWT_KEY || ""; // use process.env in real apps

// Clerk API key for server SDK operations
export const CLERK_API_KEY = process.env.CLERK_API_KEY || "";