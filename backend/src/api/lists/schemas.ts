import { z } from 'zod';

export const listParamsSchema = {
  params: z.object({
    id: z.string().uuid('Invalid ID')
  })
};

export const createListSchema = {
  body: z.object({
    name: z.string().min(1).trim(),
    description: z.string().optional(),
    context: z.string().optional()
  })
};

export const updateListSchema = {
  ...listParamsSchema,
  body: z.object({
    name: z.string().min(1).trim().optional(),
    description: z.string().optional(),
    context: z.string().optional()
  })
};
