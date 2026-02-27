import { NextFunction, Request, Response } from "express";
import { createClerkClient } from "@clerk/clerk-sdk-node";
import { CLERK_API_KEY } from "./secrets";
import type { UserClaims } from "@repo/shared-types";

const clerkClient = createClerkClient({ secretKey: CLERK_API_KEY });

declare global {
  namespace Express {
    interface Request {
      verified?: UserClaims;
    }
  }
}

export default async function verifyToken(req: Request, res: Response, next: NextFunction) {
  // Allow CORS preflight requests to pass through without requiring auth
  if (req.method === 'OPTIONS') return next();
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: "No token" });

  const token = auth.split(" ")[1];

  try {
    // Verify the session token using Clerk
    const verified = await clerkClient.verifyToken(token);
    if (!verified || !verified.sub) {
      return res.status(403).json({ error: "Invalid token" });
    }
    req.verified = { id: verified.sub } as UserClaims;
    next();
  } catch (err) {
    console.error('token verification failed', err);
    return res.status(403).json({ error: "Invalid token" });
  }
}