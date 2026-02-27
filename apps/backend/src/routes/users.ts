import { Router } from 'express';
import { createClerkClient } from '@clerk/clerk-sdk-node';
import verifyToken from '../middleware';
import { CLERK_API_KEY } from '../secrets';

const clerkClient = createClerkClient({ secretKey: CLERK_API_KEY });

const router = Router();

function extractUserId(req: any): string | null {
  if (!req.verified || typeof req.verified === 'string' || !('id' in req.verified)) return null;
  return req.verified.id;
}

router.get('/me', verifyToken, async (req, res) => {
  const userId = extractUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const user = await clerkClient.users.getUser(userId);
    return res.status(200).json(user);
  } catch (err) {
    console.error('Failed to fetch user from Clerk', err);
    return res.status(500).json({ error: 'Failed to fetch user' });
  }
});

export default router;
