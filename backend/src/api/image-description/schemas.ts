import { z } from 'zod';

export const startExerciseSchema = {
  body: z.object({
    context: z.string().optional(),
    imageSource: z.enum(['ai', 'stock']).optional().default('ai')
  })
};

export const submitDescriptionSchema = {
  body: z.object({
    context: z.string().optional(),
    imageUrl: z.string().url(),
    imageAlt: z.string().optional(),
    userDescription: z.string().min(1)
  })
};

export const addWordsSchema = {
  body: z.object({
    exerciseId: z.string().uuid(),
    listId: z.string().uuid().optional(),
    selectedWords: z.array(z.object({
      word: z.string(),
      meaning: z.string()
    })),
    createNewList: z.boolean().optional()
  })
};

export const historyQuerySchema = {
  query: z.object({
    limit: z.string().optional()
  })
};
