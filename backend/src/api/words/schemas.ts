import { z } from 'zod';

export const listIdSchema = {
  params: z.object({
    listId: z.string().uuid('Invalid list ID')
  })
};

export const wordIdSchema = {
  params: z.object({
    wordId: z.string().uuid('Invalid word ID')
  })
};

export const addWordSchema = {
  ...listIdSchema,
  body: z.object({
    word: z.string().min(1).trim(),
    meaning: z.string().optional()
  })
};

export const deleteWordSchema = {
  params: z.object({
    listId: z.string().uuid('Invalid list ID'),
    wordId: z.string().uuid('Invalid word ID')
  })
};

export const wordContextSchema = {
  ...wordIdSchema,
  body: z.object({
    contextIndex: z.number().min(0).default(0)
  })
};

export const validateAnswerSchema = {
  body: z.object({
    userAnswer: z.string().min(1),
    correctAnswer: z.string().min(1),
    context: z.string().optional()
  })
};
