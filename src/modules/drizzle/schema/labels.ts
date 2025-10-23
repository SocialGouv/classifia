import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
  vector,
} from 'drizzle-orm/pg-core';

export const labelsTable = pgTable(
  'labels',
  {
    id: uuid().primaryKey().defaultRandom(),
    name: text().notNull().unique(),
    embedding: vector('embedding', { dimensions: 1024 }).notNull(),
    isCanonical: boolean('is_canonical').default(false),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('idx_labels_embedding')
      .using('ivfflat', table.embedding.op('vector_cosine_ops'))
      .with({ lists: 100 }),
  ],
);
