import {
  doublePrecision,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

import { conversationsTable } from './conversations';
import { subjectsTable } from './subjects';

export const conversationSubjectsTable = pgTable(
  'conversation_labels',
  {
    id: uuid().primaryKey().defaultRandom(),
    conversationId: uuid('conversation_id')
      .notNull()
      .references(() => conversationsTable.id),
    subjectId: uuid('subject_id')
      .notNull()
      .references(() => subjectsTable.id),
    confidence: doublePrecision('confidence'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    conversationTimestamp: timestamp('conversation_timestamp').notNull(),
  },
  (table) => [
    {
      conversationSubjectUnique: uniqueIndex(
        'conversation_labels_conversation_subject_unq',
      ).on(table.conversationId, table.subjectId),
    },
  ],
);
