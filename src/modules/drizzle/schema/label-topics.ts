import {
  boolean,
  doublePrecision,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

import { labelsTable } from './labels';
import { topicsTable } from './topics';

export const labelTopicsTable = pgTable(
  'label_topics',
  {
    id: uuid().primaryKey().defaultRandom(),
    labelId: uuid('label_id')
      .notNull()
      .references(() => labelsTable.id, { onDelete: 'cascade' }),
    topicId: uuid('topic_id')
      .notNull()
      .references(() => topicsTable.id, { onDelete: 'cascade' }),
    confidence: doublePrecision('confidence').default(1.0),
    isPrimary: boolean('is_primary').default(true),
    assignmentMethod: text('assignment_method').default('manual'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('label_topics_label_topic_unq').on(
      table.labelId,
      table.topicId,
    ),
    index('idx_label_topics_label').on(table.labelId),
    index('idx_label_topics_topic').on(table.topicId),
  ],
);
