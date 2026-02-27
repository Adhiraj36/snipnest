import { Router } from 'express';
import verifyToken from '../middleware';
import {
  HEYGEN_API_KEY,
  HEYGEN_API_URL,
  HEYGEN_AVATAR_ID,
  HEYGEN_VOICE_ID,
  HEYGEN_CONTEXT_ID,
  HEYGEN_IS_SANDBOX,
} from '../config/env';

const router = Router();

/**
 * POST /avatar/session-token
 * Creates a HeyGen LiveAvatar session token (proxied to keep API key server-side).
 */
router.post('/session-token', verifyToken, async (req, res) => {
  const userId = req.verified?.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  if (!HEYGEN_API_KEY) {
    return res.status(503).json({ error: 'Avatar service not configured (HEYGEN_API_KEY missing)' });
  }
  if (!HEYGEN_AVATAR_ID) {
    return res.status(503).json({ error: 'Avatar service not configured (HEYGEN_AVATAR_ID missing)' });
  }

  const pushToTalk = req.body.pushToTalk === true;

  try {
    const response = await fetch(`${HEYGEN_API_URL}/v1/sessions/token`, {
      method: 'POST',
      headers: {
        'X-API-KEY': HEYGEN_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mode: 'FULL',
        avatar_id: HEYGEN_AVATAR_ID,
        avatar_persona: {
          ...(HEYGEN_VOICE_ID && { voice_id: HEYGEN_VOICE_ID }),
          ...(HEYGEN_CONTEXT_ID && { context_id: HEYGEN_CONTEXT_ID }),
          language: 'en',
        },
        ...(pushToTalk && { interactivity_type: 'PUSH_TO_TALK' }),
        is_sandbox: HEYGEN_IS_SANDBOX,
      }),
    });

    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      let errorMessage = 'Failed to create avatar session';
      if (contentType?.includes('application/json')) {
        try {
          const resp = await response.json();
          errorMessage = resp.data?.[0]?.message || resp.error || resp.message || errorMessage;
        } catch {
          /* ignore parse error */
        }
      } else {
        errorMessage = (await response.text()) || errorMessage;
      }
      return res.status(response.status).json({ error: errorMessage });
    }

    const data = await response.json();
    return res.status(200).json({
      session_token: data.data.session_token,
      session_id: data.data.session_id,
    });
  } catch (error: any) {
    console.error('Avatar session token error:', error);
    return res.status(500).json({ error: error.message || 'Failed to create avatar session' });
  }
});

/**
 * POST /avatar/stop
 * Stops an active HeyGen session (proxied).
 */
router.post('/stop', verifyToken, async (req, res) => {
  const userId = req.verified?.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const { session_token } = req.body;
  if (!session_token) return res.status(400).json({ error: 'session_token is required' });

  try {
    const response = await fetch(`${HEYGEN_API_URL}/v1/sessions`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${session_token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return res.status(response.status).json({
        error: errorData.data?.message || 'Failed to stop avatar session',
      });
    }

    return res.status(200).json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to stop avatar session' });
  }
});

/**
 * GET /avatar/config
 * Returns whether the avatar feature is available (i.e. API key is configured).
 */
router.get('/config', verifyToken, (_req, res) => {
  return res.status(200).json({
    available: !!HEYGEN_API_KEY && !!HEYGEN_AVATAR_ID,
    isSandbox: HEYGEN_IS_SANDBOX,
  });
});

export default router;
