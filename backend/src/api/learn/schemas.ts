import { z } from 'zod';

export const listIdSchema = {
  params: z.object({
    listId: z.string().uuid('Invalid list ID')
  })
};
