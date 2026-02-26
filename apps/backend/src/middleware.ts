import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { SECRET } from "./secrets";
import { UserClaims } from "./types";

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
    const decoded = jwt.verify(token, SECRET);
    if (!decoded || typeof decoded === 'string') {
      return res.status(403).json({ error: "Invalid token" });
    }
    // the token payload includes `sub` which is the Clerk user id
    const userId = (decoded as any).sub || (decoded as any).id || '';
    req.verified = { id: userId } as UserClaims;
    next();
  } catch (err) {
    console.error('token verification failed', err);
    return res.status(403).json({ error: "Invalid token" });
  }
}