import { z } from 'zod';

export const configValidationSchema = z.object({
  ALBERT_API_KEY: z.string().optional(),
  ALBERT_URL: z.string().optional(),

  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),

  NODE_ENV: z.enum(['development', 'test', 'production']),
  PORT: z.coerce.number().int().positive(),

  OPENAI_API_KEY: z.string().min(1),

  CRISP_WEBHOOK_SECRET: z.string().min(1),
  CRISP_URL: z.string().min(1),

  BULLMQ_CONCURRENCY: z.coerce.number().int().min(1),
  BULLMQ_ATTEMPTS: z.coerce.number().int().min(0),
  BULLMQ_BACKOFF_DELAY: z.coerce.number().int().min(0),
  BULLMQ_RATE_LIMIT: z.coerce.number().int().min(0),

  VECTOR_SIMILARITY_REUSE: z.coerce.number().min(0).max(1),
  VECTOR_SIMILARITY_ALIAS: z.coerce.number().min(0).max(1),

  MAX_TOKENS_PER_CONVERSATION: z.coerce.number().int().positive(),
  MAX_LABELS_PER_CONVERSATION: z.coerce.number().int().min(1),
});

export type Env = z.infer<typeof configValidationSchema>;

export function validateConfig<T extends Record<string, unknown>>(env: T): Env {
  const parsed = configValidationSchema.safeParse(env);
  if (!parsed.success) {
    throw new Error(parsed.error.message);
  }
  return parsed.data;
}
