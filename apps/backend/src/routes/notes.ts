import { Router } from 'express';
import { nanoid } from 'nanoid';
import type { Notes } from '@repo/shared-types';
import verifyToken from '../middleware';
import { CreateNote, GetUserNotes } from '../helpers/notes';

const router = Router();

function extractUserId(req: any): string | null {
  if (!req.verified || typeof req.verified === 'string' || !('id' in req.verified)) return null;
  return req.verified.id;
}

router.post('/', verifyToken, async (req, res) => {
  const userId = extractUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const { title, content } = req.body as { title: string; content: string };
  const note: Notes = {
    id: nanoid(),
    user_id: userId,
    title,
    content,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const response = await CreateNote(note);
  return res.status(201).json(response);
});

router.get('/', verifyToken, async (req, res) => {
  const userId = extractUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const notes = await GetUserNotes(userId);
  return res.status(200).json(notes || []);
});

export default router;
