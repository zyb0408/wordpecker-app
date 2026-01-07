import { query } from '../config/postgresql';

export interface UserLanguages {
  baseLanguage: string;
  targetLanguage: string;
}

export async function getUserLanguages(tenantId: string): Promise<UserLanguages> {
  // In v3, we use tenantId instead of userId for preferences
  const result = await query('SELECT base_language, target_language FROM tenant_preferences WHERE tenant_id = $1', [tenantId]);
  
  if (result.rows.length > 0) {
    return {
      baseLanguage: result.rows[0].base_language || 'en',
      targetLanguage: result.rows[0].target_language || 'en'
    };
  }
  
  return {
    baseLanguage: 'en',
    targetLanguage: 'en'
  };
}
