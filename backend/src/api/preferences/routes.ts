import { Router, Request, Response } from 'express';
import { validate } from 'echt';
import { query } from '../../config/postgresql';
import { updatePreferencesSchema } from './schemas';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    
    let result = await query('SELECT * FROM tenant_preferences WHERE tenant_id = $1', [tenantId]);
    
    if (result.rows.length === 0) {
      // Create default preferences if not exists
      result = await query(
        'INSERT INTO tenant_preferences (tenant_id) VALUES ($1) RETURNING *',
        [tenantId]
      );
    }

    const preferences = result.rows[0];
    res.json({
      exerciseTypes: preferences.exercise_types,
      baseLanguage: preferences.base_language,
      targetLanguage: preferences.target_language
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch preferences' });
  }
});

router.put('/', validate(updatePreferencesSchema), async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const { exerciseTypes, baseLanguage, targetLanguage } = req.body;
    
    if (exerciseTypes && Object.values(exerciseTypes).filter(Boolean).length === 0) {
      return res.status(400).json({ error: 'At least one exercise type must be enabled' });
    }

    const result = await query(
      `INSERT INTO tenant_preferences (tenant_id, exercise_types, base_language, target_language)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (tenant_id) DO UPDATE SET
         exercise_types = COALESCE($2, tenant_preferences.exercise_types),
         base_language = COALESCE($3, tenant_preferences.base_language),
         target_language = COALESCE($4, tenant_preferences.target_language),
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [tenantId, exerciseTypes, baseLanguage, targetLanguage]
    );

    const preferences = result.rows[0];
    res.json({
      exerciseTypes: preferences.exercise_types,
      baseLanguage: preferences.base_language,
      targetLanguage: preferences.target_language
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

export default router;
