import { Router, Request, Response } from 'express';
import { validate } from 'echt';
import { query } from '../../config/postgresql';
import { createListSchema, listParamsSchema, updateListSchema } from './schemas';

const router = Router();

router.post('/', validate(createListSchema), async (req: Request, res: Response) => {
  try {
    const { name, description, context } = req.body;
    const tenantId = (req as any).tenantId;
    
    const result = await query(
      'INSERT INTO word_lists (tenant_id, name, description, context) VALUES ($1, $2, $3, $4) RETURNING *',
      [tenantId, name, description, context]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating list' });
  }
});

router.get('/', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const result = await query(
      `SELECT wl.*, 
              COUNT(wc.id) as "wordCount",
              COALESCE(AVG(wc.learned_point), 0) as "averageProgress",
              COUNT(CASE WHEN wc.learned_point >= 80 THEN 1 END) as "masteredWords"
       FROM word_lists wl
       LEFT JOIN word_contexts wc ON wl.id = wc.list_id
       WHERE wl.tenant_id = $1
       GROUP BY wl.id
       ORDER BY wl.created_at DESC`,
      [tenantId]
    );
    
    res.json(result.rows.map(row => ({
      ...row,
      averageProgress: Math.round(Number(row.averageProgress)),
      wordCount: Number(row.wordCount),
      masteredWords: Number(row.masteredWords)
    })));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching lists' });
  }
});

router.get('/:id', validate(listParamsSchema), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = (req as any).tenantId;
    
    const result = await query(
      'SELECT * FROM word_lists WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );
    
    if (result.rows.length === 0) return res.status(404).json({ message: 'List not found' });
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching list' });
  }
});

router.put('/:id', validate(updateListSchema), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, context } = req.body;
    const tenantId = (req as any).tenantId;
    
    const result = await query(
      'UPDATE word_lists SET name = $1, description = $2, context = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 AND tenant_id = $5 RETURNING *',
      [name, description, context, id, tenantId]
    );
    
    if (result.rows.length === 0) return res.status(404).json({ message: 'List not found' });
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error updating list' });
  }
});

router.delete('/:id', validate(listParamsSchema), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = (req as any).tenantId;
    
    const result = await query(
      'DELETE FROM word_lists WHERE id = $1 AND tenant_id = $2 RETURNING *',
      [id, tenantId]
    );
    
    if (result.rows.length === 0) return res.status(404).json({ message: 'List not found' });
    
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Error deleting list' });
  }
});

export default router;
