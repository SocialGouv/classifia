import {
  doublePrecision,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

import { discussionsTable } from './discussions';
import { labelsTable } from './labels';

export const vaeEntityEnum = pgEnum('vae_entity', [
  'certificateur',
  'aap',
  'candidat',
  'non_identifie',
]);

export const discussionClassificationsTable = pgTable(
  'discussion_classifications',
  {
    id: uuid().primaryKey().defaultRandom(),
    discussionId: uuid('discussion_id')
      .notNull()
      .references(() => discussionsTable.id, { onDelete: 'cascade' }),
    labelId: uuid('label_id')
      .notNull()
      .references(() => labelsTable.id),
    confidence: doublePrecision('confidence').notNull(),
    discussionTimestamp: timestamp('discussion_timestamp').notNull(),
    discussionHash: text('discussion_hash').notNull().unique(),
    classificationMethod: text('classification_method').default('ai_agent'),
    detectedEntity: vaeEntityEnum('detected_entity')
      .notNull()
      .default('non_identifie'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('discussion_classifications_discussion_label_unq').on(
      table.discussionId,
      table.labelId,
    ),
    index('idx_discussion_classifications_discussion').on(table.discussionId),
    index('idx_discussion_classifications_label').on(table.labelId),
  ],
);
