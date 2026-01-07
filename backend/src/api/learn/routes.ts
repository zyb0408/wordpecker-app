import { Router, Request, Response } from 'express';
import { validate } from 'echt';
import { query } from '../../config/postgresql';
import { QuestionType } from '../../types';
import { learnAgentService } from './agent-service';
import { getUserLanguages } from '../../utils/getUserLanguages';
import { listIdSchema } from './schemas';

const router = Router();

const getExerciseTypes = async (tenantId: string): Promise<QuestionType[]> => {
  // In v3, preferences are also tenant-based
  const result = await query('SELECT exercise_types FROM tenant_preferences WHERE tenant_id = $1', [tenantId]);
  if (result.rows.length > 0 && result.rows[0].exercise_types) {
    const types = result.rows[0].exercise_types;
    return Object.entries(types)
      .filter(([_, enabled]) => enabled)
      .map(([type]) => type as QuestionType);
  }
  return ['multiple_choice', 'fill_blank', 'true_false'];
};

router.post('/:listId/start', validate(listIdSchema), async (req: Request, res: Response) => {
  try {
    const { listId } = req.params;
    const tenantId = (req as any).tenantId;

    // 1. Get list and words for this tenant
    const listResult = await query('SELECT * FROM word_lists WHERE id = $1 AND tenant_id = $2', [listId, tenantId]);
    if (listResult.rows.length === 0) return res.status(404).json({ message: 'List not found' });
    const list = listResult.rows[0];

    const wordsResult = await query(
      `SELECT w.id, w.value, wc.meaning, wc.learned_point as "learnedPoint"
       FROM words w
       JOIN word_contexts wc ON w.id = wc.word_id
       WHERE wc.list_id = $1
       ORDER BY wc.learned_point ASC, RANDOM()
       LIMIT 5`,
      [listId]
    );

    if (wordsResult.rows.length === 0) return res.status(400).json({ message: 'List has no words' });

    const userId = req.headers['user-id'] as string;
    const [exerciseTypes, { baseLanguage, targetLanguage }] = await Promise.all([
      getExerciseTypes(tenantId),
      getUserLanguages(userId || 'default')
    ]);

    const exercises = await learnAgentService.generateExercises(
      wordsResult.rows, 
      list.context || 'General', 
      exerciseTypes, 
      baseLanguage, 
      targetLanguage
    );

    res.json({
      exercises,
      list: { id: list.id, name: list.name, context: list.context }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error starting learning session' });
  }
});

router.post('/:listId/more', validate(listIdSchema), async (req: Request, res: Response) => {
  try {
    const { listId } = req.params;
    const tenantId = (req as any).tenantId;

    const listResult = await query('SELECT * FROM word_lists WHERE id = $1 AND tenant_id = $2', [listId, tenantId]);
    if (listResult.rows.length === 0) return res.status(404).json({ message: 'List not found' });
    const list = listResult.rows[0];

    const wordsResult = await query(
      `SELECT w.id, w.value, wc.meaning, wc.learned_point as "learnedPoint"
       FROM words w
       JOIN word_contexts wc ON w.id = wc.word_id
       WHERE wc.list_id = $1
       ORDER BY wc.learned_point ASC, RANDOM()
       LIMIT 5`,
      [listId]
    );

    if (wordsResult.rows.length === 0) return res.status(400).json({ message: 'List has no words' });

    const userId = req.headers['user-id'] as string;
    const [exerciseTypes, { baseLanguage, targetLanguage }] = await Promise.all([
      getExerciseTypes(tenantId),
      getUserLanguages(userId || 'default')
    ]);

    const exercises = await learnAgentService.generateExercises(
      wordsResult.rows, 
      list.context || 'General', 
      exerciseTypes, 
      baseLanguage, 
      targetLanguage
    );

    res.json({ exercises });
  } catch (error) {
    res.status(500).json({ message: 'Error getting more exercises' });
  }
});

export default router;
