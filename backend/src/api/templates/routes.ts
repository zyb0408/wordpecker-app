import { Router, Request, Response } from 'express';
import { validate } from 'echt';
import { query } from '../../config/postgresql';
import { templateParamsSchema, cloneTemplateSchema, templatesQuerySchema } from './schemas';

const router = Router();

router.get('/', validate(templatesQuerySchema), async (req: Request, res: Response) => {
  try {
    const { category, difficulty, search, featured } = req.query;
    
    let sql = `
      SELECT t.*, 
             (SELECT COUNT(*) FROM template_words tw WHERE tw.template_id = t.id) as "wordCount",
             ARRAY(SELECT tag FROM template_tags tt WHERE tt.template_id = t.id) as tags
      FROM templates t
      WHERE 1=1
    `;
    const params: any[] = [];

    if (category && category !== 'all') {
      params.push(category);
      sql += ` AND t.category = $${params.length}`;
    }
    if (difficulty && difficulty !== 'all') {
      params.push(difficulty);
      sql += ` AND t.difficulty = $${params.length}`;
    }
    if (featured === 'true') {
      sql += ` AND t.featured = true`;
    }
    if (search) {
      params.push(`%${search}%`);
      sql += ` AND (t.name ILIKE $${params.length} OR t.description ILIKE $${params.length})`;
    }

    sql += ` ORDER BY t.featured DESC, t.clone_count DESC, t.created_at DESC`;
    
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching templates' });
  }
});

router.get('/categories', async (req: Request, res: Response) => {
  try {
    const result = await query('SELECT DISTINCT category FROM templates ORDER BY category');
    res.json(result.rows.map(r => r.category));
  } catch (error) {
    res.status(500).json({ message: 'Error fetching categories' });
  }
});

router.get('/:id', validate(templateParamsSchema), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const templateResult = await query('SELECT * FROM templates WHERE id = $1', [id]);
    if (templateResult.rows.length === 0) return res.status(404).json({ message: 'Template not found' });
    
    const wordsResult = await query('SELECT value, meaning FROM template_words WHERE template_id = $1', [id]);
    const tagsResult = await query('SELECT tag FROM template_tags WHERE template_id = $1', [id]);

    res.json({
      ...templateResult.rows[0],
      words: wordsResult.rows,
      tags: tagsResult.rows.map(r => r.tag),
      wordCount: wordsResult.rows.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching template' });
  }
});

router.post('/:id/clone', validate(cloneTemplateSchema), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const tenantId = (req as any).tenantId;
    
    const templateResult = await query('SELECT * FROM templates WHERE id = $1', [id]);
    if (templateResult.rows.length === 0) return res.status(404).json({ message: 'Template not found' });
    const template = templateResult.rows[0];

    const wordsResult = await query('SELECT value, meaning FROM template_words WHERE template_id = $1', [id]);

    // 1. Create new list for tenant
    const newListResult = await query(
      'INSERT INTO word_lists (tenant_id, name, description, context) VALUES ($1, $2, $3, $4) RETURNING *',
      [tenantId, name || `${template.name} (Copy)`, template.description, template.context]
    );
    const newList = newListResult.rows[0];

    // 2. Clone words
    for (const tw of wordsResult.rows) {
      const val = tw.value.toLowerCase().trim();
      
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
      await query(
        'INSERT INTO word_contexts (word_id, list_id, meaning, learned_point) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING',
        [wordId, newList.id, tw.meaning, 0]
      );
    }
    
    await query('UPDATE templates SET clone_count = clone_count + 1 WHERE id = $1', [id]);
    
    res.status(201).json({
      ...newList,
      wordCount: wordsResult.rows.length,
      averageProgress: 0,
      masteredWords: 0
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error cloning template' });
  }
});

export default router;
