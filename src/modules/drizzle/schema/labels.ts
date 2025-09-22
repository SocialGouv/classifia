import { pgTable, text, timestamp, uuid, vector } from 'drizzle-orm/pg-core';

export const labelsTable = pgTable('labels', {
  id: uuid().primaryKey().defaultRandom(),
  name: text().notNull().unique(),
  embedding: vector('embedding', { dimensions: 1536 }),
  aliasOf: uuid('alias_of').references(() => labelsTable.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
