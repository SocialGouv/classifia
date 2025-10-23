import {
  index,
  pgTable,
  text,
  timestamp,
  uuid,
  vector,
} from 'drizzle-orm/pg-core';

import { thematicsTable } from './thematics';

export const topicsTable = pgTable(
  'topics',
  {
    id: uuid().primaryKey().defaultRandom(),
    thematicId: uuid('thematic_id')
      .notNull()
      .references(() => thematicsTable.id),
    name: text().notNull(),
    slug: text().notNull(),
    embedding: vector('embedding', { dimensions: 1024 }),
    description: text(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('idx_topics_thematic').on(table.thematicId),
    index('idx_topics_embedding')
      .using('ivfflat', table.embedding.op('vector_cosine_ops'))
      .with({ lists: 50 }),
  ],
);
