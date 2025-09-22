import {
  doublePrecision,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

import { conversationsTable } from './conversations';
import { labelsTable } from './labels';

export const conversationLabelsTable = pgTable(
  'conversation_labels',
  {
    id: uuid().primaryKey().defaultRandom(),
    conversationId: uuid('conversation_id')
      .notNull()
      .references(() => conversationsTable.id),
    labelId: uuid('label_id')
      .notNull()
      .references(() => labelsTable.id),
    confidence: doublePrecision('confidence'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    {
      conversationLabelUnique: uniqueIndex(
        'conversation_labels_conversation_label_unq',
      ).on(table.conversationId, table.labelId),
    },
  ],
);
