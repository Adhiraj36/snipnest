import { NextFunction, Request, Response } from "express";
import { createClerkClient } from "@clerk/clerk-sdk-node";
import { SECRET, CLERK_API_KEY } from "./secrets";
import { UserClaims } from "./types";

declare global {
  namespace Express {
    interface Request {
      verified?: UserClaims;
    }
  }
}

const clerkClient = createClerkClient({ secretKey: CLERK_API_KEY });

export default async function verifyToken(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: "No token" });

  const token = auth.split(" ")[1];

  try {
    // clerkClient.verifyToken will validate the JWT using the provided secret
    // (our template secret) and return the decoded payload.
    const decoded = await clerkClient.verifyToken(token, { jwtKey: SECRET });
    if (!decoded || typeof decoded === 'string') {
      return res.status(403).json({ error: "Invalid token" });
    }
    // the token payload includes `sub` which is the Clerk user id
    const userId = (decoded as any).sub || (decoded as any).user_id || '';
    req.verified = { id: userId } as UserClaims;
    next();
  } catch (err) {
    console.error('token verification failed', err);
    return res.status(403).json({ error: "Invalid token" });
  }
}