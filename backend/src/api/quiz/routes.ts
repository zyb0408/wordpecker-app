import { Router, Request, Response } from 'express';
import { validate } from 'echt';
import { query } from '../../config/postgresql';
import { QuestionType } from '../../types';
import { quizAgentService } from './agent-service';
import { listIdSchema, updatePointsSchema } from './schemas';

const router = Router();

const getQuestionTypes = async (tenantId: string): Promise<QuestionType[]> => {
  const result = await query('SELECT exercise_types FROM tenant_preferences WHERE tenant_id = $1', [tenantId]);
  if (result.rows.length > 0 && result.rows[0].exercise_types) {
    const types = result.rows[0].exercise_types;
    return Object.entries(types)
      .filter(([_, enabled]) => enabled)
      .map(([type]) => type as QuestionType);
  }
  return ['multiple_choice', 'fill_blank', 'true_false', 'sentence_completion'];
};

router.post('/:listId/start', validate(listIdSchema), async (req: Request, res: Response) => {
  try {
    const { listId } = req.params;
    const tenantId = (req as any).tenantId;

    const listResult = await query('SELECT * FROM word_lists WHERE id = $1 AND tenant_id = $2', [listId, tenantId]);
    if (listResult.rows.length === 0) return res.status(404).json({ message: 'List not found' });
    const list = listResult.rows[0];

    const wordsResult = await query(
      `SELECT w.id, w.value, wc.meaning
       FROM words w
       JOIN word_contexts wc ON w.id = wc.word_id
       WHERE wc.list_id = $1
       ORDER BY RANDOM()`,
      [listId]
    );

    if (wordsResult.rows.length === 0) return res.status(400).json({ message: 'List has no words' });

    const questionTypes = await getQuestionTypes(tenantId);
    const questions = await quizAgentService.generateQuestions(
      wordsResult.rows.slice(0, 5), 
      list.context || 'General', 
      questionTypes
    );

    res.json({ 
      questions,
      total_questions: wordsResult.rows.length,
      list: { id: list.id, name: list.name, context: list.context }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error starting quiz' });
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
      `SELECT w.id, w.value, wc.meaning
       FROM words w
       JOIN word_contexts wc ON w.id = wc.word_id
       WHERE wc.list_id = $1
       ORDER BY RANDOM()
       LIMIT 5`,
      [listId]
    );

    if (wordsResult.rows.length === 0) return res.status(400).json({ message: 'List has no words' });

    const questionTypes = await getQuestionTypes(tenantId);
    const questions = await quizAgentService.generateQuestions(
      wordsResult.rows, 
      list.context || 'General', 
      questionTypes
    );

    res.json({ questions });
  } catch (error) {
    res.status(500).json({ message: 'Error getting more questions' });
  }
});

router.put('/:listId/learned-points', validate(updatePointsSchema), async (req: Request, res: Response) => {
  try {
    const { listId } = req.params;
    const { results } = req.body;
    const tenantId = (req as any).tenantId;

    // Verify list ownership
    const listCheck = await query('SELECT id FROM word_lists WHERE id = $1 AND tenant_id = $2', [listId, tenantId]);
    if (listCheck.rows.length === 0) return res.status(404).json({ message: 'List not found' });

    await Promise.all(results.map(async (result: { wordId: string, correct: boolean }) => {
      const updateQuery = result.correct 
        ? 'UPDATE word_contexts SET learned_point = LEAST(100, learned_point + 10), updated_at = CURRENT_TIMESTAMP WHERE word_id = $1 AND list_id = $2'
        : 'UPDATE word_contexts SET learned_point = GREATEST(0, learned_point - 5), updated_at = CURRENT_TIMESTAMP WHERE word_id = $1 AND list_id = $2';
      
      await query(updateQuery, [result.wordId, listId]);
    }));
    
    res.json({ message: 'Learned points updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating learned points' });
  }
});

export default router;
