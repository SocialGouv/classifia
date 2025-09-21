import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const conversationsTable = pgTable('conversations', {
  id: uuid().primaryKey().defaultRandom(),
  textHash: text('text_hash').notNull().unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
