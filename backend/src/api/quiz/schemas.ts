import { z } from 'zod';

export const listIdSchema = {
  params: z.object({
    listId: z.string().uuid('Invalid list ID')
  })
};

export const updatePointsSchema = {
  params: z.object({
    listId: z.string().uuid('Invalid list ID')
  }),
  body: z.object({
    results: z.array(z.object({
      wordId: z.string().uuid('Invalid word ID'),
      correct: z.boolean()
    }))
  })
};
