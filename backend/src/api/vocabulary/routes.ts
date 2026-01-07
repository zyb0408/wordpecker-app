import { Router, Request, Response } from 'express';
import { validate } from 'echt';
import { query } from '../../config/postgresql';
import { openaiRateLimiter } from '../../middleware/rateLimiter';
import { vocabularyAgentService } from './agent-service';
import { getUserLanguages } from '../../utils/getUserLanguages';
import { generateWordsSchema, getWordDetailsSchema } from './schemas';

const router = Router();

router.post('/generate-words', openaiRateLimiter, validate(generateWordsSchema), async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const { context, count = 10, difficulty = 'intermediate' } = req.body;
    
    if (!context || typeof context !== 'string') {
      return res.status(400).json({ error: 'Context is required and must be a string' });
    }

    const wordCount = Math.min(Math.max(parseInt(String(count)) || 10, 1), 20);

    // Find existing words for this tenant that match the context
    const existingWordsResult = await query(
      `SELECT DISTINCT w.value 
       FROM words w
       JOIN word_contexts wc ON w.id = wc.word_id
       JOIN word_lists wl ON wc.list_id = wl.id
       WHERE w.tenant_id = $1 AND (wl.context ILIKE $2 OR wl.name ILIKE $2)`,
      [tenantId, `%${context}%`]
    );

    const wordsToExclude = existingWordsResult.rows.map(r => r.value.toLowerCase());

    const { baseLanguage, targetLanguage } = await getUserLanguages(tenantId);
    const vocabularyWords = await vocabularyAgentService.generateWords(
      wordCount, 
      difficulty, 
      context, 
      baseLanguage, 
      targetLanguage, 
      wordsToExclude
    );

    res.json({
      context,
      difficulty,
      words: vocabularyWords,
      count: vocabularyWords.length,
      excludedWords: wordsToExclude.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate vocabulary words' });
  }
});

router.post('/get-word-details', openaiRateLimiter, validate(getWordDetailsSchema), async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const { word, context } = req.body;
    
    if (!word || typeof word !== 'string') {
      return res.status(400).json({ error: 'Word is required and must be a string' });
    }

    const { baseLanguage, targetLanguage } = await getUserLanguages(tenantId);
    const wordInfo = await vocabularyAgentService.getWordDetails(word, context, baseLanguage, targetLanguage);

    res.json({
      word: wordInfo.word,
      meaning: wordInfo.meaning,
      example: wordInfo.example,
      difficulty_level: wordInfo.difficulty_level,
      context: wordInfo.context
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get word details' });
  }
});

export default router;
