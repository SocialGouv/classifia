import { pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';

import { conversationsTable } from './conversations';
import { labelsTable } from './labels';

export const conversationLabelsTable = pgTable('conversation_labels', {
  id: uuid().primaryKey().defaultRandom(),
  conversationId: uuid('conversation_id')
    .notNull()
    .references(() => conversationsTable.id),
  labelId: uuid('label_id')
    .notNull()
    .references(() => labelsTable.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
