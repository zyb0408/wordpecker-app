import { Router, Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';
import { elevenLabsService, AudioGenerationRequest } from '../../services/elevenlabs';

const router = Router();

const audioGenerationLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { error: 'Too many audio generation requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const audioCacheLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Too many audio cache requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/generate',
  audioGenerationLimit,
  [
    body('text').isString().isLength({ min: 1, max: 2500 }),
    body('voice').optional().isString(),
    body('language').optional().isString(),
    body('speed').optional().isFloat({ min: 0.5, max: 2.0 }),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ error: 'Validation failed', details: errors.array() });

      const { text, voice, language, speed } = req.body as AudioGenerationRequest;
      const tenantId = (req as any).tenantId;

      const result = await elevenLabsService.generateAudio({
        text,
        voice,
        language,
        speed,
        userId: tenantId, // Use tenantId for language preference lookup
      });

      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ error: 'Failed to generate audio' });
    }
  }
);

router.get('/cache/:cacheKey',
  audioCacheLimit,
  [param('cacheKey').isString().isLength({ min: 32, max: 32 })],
  async (req: Request, res: Response) => {
    try {
      const { cacheKey } = req.params;
      const audioBuffer = elevenLabsService.getCachedAudio(cacheKey);
      if (!audioBuffer) return res.status(404).json({ error: 'Audio not found' });

      res.set({
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.length.toString(),
        'Cache-Control': 'public, max-age=31536000',
        'Access-Control-Allow-Origin': '*',
      });
      res.send(audioBuffer);
    } catch (error) {
      res.status(500).json({ error: 'Failed to serve audio' });
    }
  }
);

router.post('/word-pronunciation',
  audioGenerationLimit,
  [
    body('word').isString().isLength({ min: 1, max: 100 }),
    body('language').optional().isString(),
    body('context').optional().isString(),
  ],
  async (req: Request, res: Response) => {
    try {
      const { word, language, context } = req.body;
      const tenantId = (req as any).tenantId;

      const result = await elevenLabsService.generateAudio({
        text: context ? `${word}. ${context}` : word,
        language,
        speed: 0.9,
        userId: tenantId,
      });

      res.json({ success: true, data: { ...result, word, language } });
    } catch (error) {
      res.status(500).json({ error: 'Failed to generate word pronunciation' });
    }
  }
);

router.post('/sentence-pronunciation',
  audioGenerationLimit,
  [
    body('sentence').isString().isLength({ min: 1, max: 1000 }),
    body('language').optional().isString(),
    body('speed').optional().isFloat({ min: 0.5, max: 2.0 }),
  ],
  async (req: Request, res: Response) => {
    try {
      const { sentence, language, speed = 1.0 } = req.body;
      const tenantId = (req as any).tenantId;

      const result = await elevenLabsService.generateAudio({
        text: sentence,
        language,
        speed,
        userId: tenantId,
      });

      res.json({ success: true, data: { ...result, sentence, language, speed } });
    } catch (error) {
      res.status(500).json({ error: 'Failed to generate sentence pronunciation' });
    }
  }
);

export default router;
