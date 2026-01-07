import { z } from 'zod';

export const templateParamsSchema = {
  params: z.object({
    id: z.string().uuid('Invalid template ID')
  })
};

export const cloneTemplateSchema = {
  ...templateParamsSchema,
  body: z.object({
    name: z.string().optional()
  })
};

export const templatesQuerySchema = {
  query: z.object({
    category: z.string().optional(),
    difficulty: z.string().optional(),
    search: z.string().optional(),
    featured: z.string().optional()
  })
};
