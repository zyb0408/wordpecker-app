import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';
import { openai } from '../../config/openai';
import { getUserLanguages } from '../../utils/getUserLanguages';
import { query } from '../../config/postgresql';

const router = Router();

const voiceSessionLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many voice session requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/session',
  voiceSessionLimit,
  [body('listId').isString().isLength({ min: 1 })],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ error: 'Validation failed', details: errors.array() });

      const { listId } = req.body;
      const tenantId = (req as any).tenantId;

      // 1. Get tenant's language preferences
      const userLanguages = await getUserLanguages(tenantId);

      // 2. Get the word list to provide context (PostgreSQL)
      const listResult = await query('SELECT * FROM word_lists WHERE id = $1 AND tenant_id = $2', [listId, tenantId]);
      if (listResult.rows.length === 0) return res.status(404).json({ error: 'Word list not found' });
      const wordList = listResult.rows[0];

      // 3. Generate ephemeral token via OpenAI
      const sessionResponse = await (openai as any).beta.realtime.sessions.create({
        model: 'gpt-4o-realtime-preview-2024-12-17',
        voice: 'alloy',
      });

      res.json({
        success: true,
        data: {
          clientSecret: sessionResponse.client_secret.value,
          expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
          sessionId: sessionResponse.client_secret.value,
          listContext: {
            listId: wordList.id,
            listName: wordList.name,
            description: wordList.description,
            context: wordList.context,
          },
          userLanguages
        },
      });
    } catch (error) {
      console.error('Voice session creation error:', error);
      res.status(500).json({ error: 'Failed to create voice session' });
    }
  }
);

export default router;
