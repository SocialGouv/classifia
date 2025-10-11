import z from 'zod';

export const classifyConversationSchema = z.object({
  session_id: z.string(),
  conversation: z.object({
    timestamp: z.number(),
    description: z.string().max(100).min(3).or(z.literal('SKIP')),
    confidence: z.number(),
  }),
});
