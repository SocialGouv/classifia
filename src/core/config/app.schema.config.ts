import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';

export const configValidationSchema = z.object({
  ALBERT_API_KEY: z.string().optional(),
  ALBERT_URL: z.string().optional(),

  DATABASE_URL: z.url(),
  REDIS_URL: z.url(),

  NODE_ENV: z.enum(['development', 'test', 'production']),
  PORT: z.coerce.number().int().positive(),

  CRISP_WEBHOOK_SECRET: z.string().min(1),
  CRISP_API_KEY: z.string().min(1),
  CRISP_URL: z.url(),

  BULLMQ_CONCURRENCY: z.coerce.number().int().min(1),
  BULLMQ_ATTEMPTS: z.coerce.number().int().min(0),
  BULLMQ_BACKOFF_DELAY: z.coerce.number().int().min(0),
  BULLMQ_RATE_LIMIT: z.coerce.number().int().min(0),

  MAX_TOKENS_PER_CONVERSATION: z.coerce.number().int().positive(),
  MAX_LABELS_PER_CONVERSATION: z.coerce.number().int().min(1),

  LABEL_SIMILARITY_THRESHOLD: z.coerce.number().min(0).max(1).default(0.92),
  TOPIC_SIMILARITY_THRESHOLD: z.coerce.number().min(0).max(1).default(0.75),
  TOPIC_ASSIGNMENT_MAX_TOPICS: z.coerce.number().int().min(1).max(5).default(3),
  RAG_RETRIEVE_TOPICS_LIMIT: z.coerce.number().int().min(1).max(10).default(5),
});

export type Env = z.infer<typeof configValidationSchema>;

export function validateConfig<T extends Record<string, unknown>>(env: T): Env {
  const parsed = configValidationSchema.safeParse(env);
  if (!parsed.success) {
    throw new BadRequestException(
      `Configuration validation failed: ${parsed.error.message}`,
    );
  }
  return parsed.data;
}
