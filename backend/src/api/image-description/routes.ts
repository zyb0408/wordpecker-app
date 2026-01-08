import { Router, Request, Response } from 'express';
import { validate } from 'echt';
import { query } from '../../config/postgresql';
import { imageDescriptionAgentService } from './agent-service';
import { stockPhotoService } from './stock-photo-service';
import { getUserLanguages } from '../../utils/getUserLanguages';
import { storageService } from '../../services/storage';
import { downloadImage, extractFilenameFromUrl } from '../../utils/imageDownloader';
import {
  startExerciseSchema,
  submitDescriptionSchema,
  addWordsSchema,
  historyQuerySchema
} from './schemas';

const router = Router();

router.post('/start', validate(startExerciseSchema), async (req: Request, res: Response) => {
  try {
    const { context, imageSource } = req.body;
    const tenantId = (req as any).tenantId;

    const exerciseContext = context || await imageDescriptionAgentService.generateContext();
    const image = imageSource === 'ai'
      ? await imageDescriptionAgentService.generateAIImage(exerciseContext, tenantId)
      : await stockPhotoService.findStockImage(exerciseContext, tenantId);

    // Download and persist the image
    let persistedImageUrl = image.url;
    try {
      const { buffer, contentType } = await downloadImage(image.url);
      const filename = extractFilenameFromUrl(image.url);
      // 传递 tenantId 以按用户组织文件
      persistedImageUrl = await storageService.uploadFile(buffer, filename, contentType, tenantId);
      console.log(`✅ Image persisted for tenant ${tenantId}: ${persistedImageUrl}`);
    } catch (error) {
      console.error('Failed to persist image, using original URL:', error);
      // 如果持久化失败，继续使用原始 URL
    }

    res.json({
      context: exerciseContext,
      image: { url: persistedImageUrl, alt: image.alt_description, id: image.id },
      instructions: "Look at this image carefully and describe what you see. Include details about objects, people, actions, emotions, colors, and atmosphere. Write in your target language and be as descriptive as you can!"
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to start description exercise';
    res.status(400).json({ error: message });
  }
});

router.post('/submit', validate(submitDescriptionSchema), async (req: Request, res: Response) => {
  try {
    const { context, imageUrl, imageAlt, userDescription } = req.body;
    const tenantId = (req as any).tenantId;

    const { baseLanguage, targetLanguage } = await getUserLanguages(tenantId);

    const analysis = await imageDescriptionAgentService.analyzeDescription(
      userDescription,
      imageUrl,
      context || 'General image description',
      baseLanguage,
      targetLanguage
    );

    const result = await query(
      `INSERT INTO image_description_exercises (tenant_id, context, image_url, image_alt, user_description, analysis, recommended_words)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [tenantId, context || 'General image description', imageUrl, imageAlt || '', userDescription.trim(), analysis, analysis.recommendations]
    );

    res.json({
      exerciseId: result.rows[0].id,
      analysis,
      message: 'Great job! Here\'s your personalized feedback and vocabulary recommendations.'
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to analyze description';
    res.status(400).json({ error: message });
  }
});

router.post('/add-words', validate(addWordsSchema), async (req: Request, res: Response) => {
  try {
    const { exerciseId, listId, selectedWords, createNewList } = req.body;
    const tenantId = (req as any).tenantId;

    const exerciseResult = await query('SELECT * FROM image_description_exercises WHERE id = $1 AND tenant_id = $2', [exerciseId, tenantId]);
    if (exerciseResult.rows.length === 0) return res.status(404).json({ error: 'Exercise not found' });
    const exercise = exerciseResult.rows[0];

    let targetListId;
    let targetListName;

    if (createNewList) {
      const contextName = exercise.context.length > 50 ? exercise.context.substring(0, 47) + '...' : exercise.context;
      const newList = await query(
        'INSERT INTO word_lists (tenant_id, name, description, context) VALUES ($1, $2, $3, $4) RETURNING id, name',
        [tenantId, `📸 ${contextName}`, `Vocabulary discovered through image description: ${exercise.context}`, exercise.context]
      );
      targetListId = newList.rows[0].id;
      targetListName = newList.rows[0].name;
    } else {
      const listResult = await query('SELECT id, name FROM word_lists WHERE id = $1 AND tenant_id = $2', [listId, tenantId]);
      if (listResult.rows.length === 0) return res.status(404).json({ error: 'Word list not found' });
      targetListId = listResult.rows[0].id;
      targetListName = listResult.rows[0].name;
    }

    const addedWords = [];
    for (const { word, meaning } of selectedWords) {
      const val = word.toLowerCase().trim();

      // Find or create word for this tenant
      let wordResult = await query('SELECT id FROM words WHERE value = $1 AND tenant_id = $2', [val, tenantId]);
      let wordId;
      if (wordResult.rows.length === 0) {
        const newWord = await query('INSERT INTO words (tenant_id, value) VALUES ($1, $2) RETURNING id', [tenantId, val]);
        wordId = newWord.rows[0].id;
      } else {
        wordId = wordResult.rows[0].id;
      }

      // Create context
      const contextCheck = await query('SELECT id FROM word_contexts WHERE word_id = $1 AND list_id = $2', [wordId, targetListId]);
      if (contextCheck.rows.length === 0) {
        await query(
          'INSERT INTO word_contexts (word_id, list_id, meaning, learned_point) VALUES ($1, $2, $3, $4)',
          [wordId, targetListId, meaning, 0]
        );
        addedWords.push({ word, meaning });
      }
    }

    res.json({
      message: createNewList
        ? `Created new list "${targetListName}" and added ${addedWords.length} words`
        : `Successfully added ${addedWords.length} words to your list`,
      addedWords,
      listId: targetListId,
      listName: targetListName,
      createdNewList: !!createNewList
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to add words to list';
    res.status(400).json({ error: message });
  }
});

router.get('/history', validate(historyQuerySchema), async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const { limit = 10 } = req.query;

    const result = await query(
      `SELECT id, context, image_url as "imageUrl", image_alt as "imageAlt", user_description as "userDescription", 
              analysis->'feedback' as feedback, created_at as "createdAt"
       FROM image_description_exercises
       WHERE tenant_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [tenantId, limit]
    );

    res.json({ exercises: result.rows });
  } catch (error) {
    res.status(400).json({ error: 'Failed to fetch exercise history' });
  }
});

router.get('/context-suggestions', async (req: Request, res: Response) => {
  try {
    const suggestions = await Promise.all(
      Array(5).fill(null).map(() => imageDescriptionAgentService.generateContext())
    );
    res.json({ suggestions });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get context suggestions' });
  }
});

export default router;
