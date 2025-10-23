import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const sessionsTable = pgTable('sessions', {
  id: uuid().primaryKey().defaultRandom(),
  crispConversationId: text('crisp_conversation_id').notNull().unique(),
  textHash: text('text_hash').notNull().unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
