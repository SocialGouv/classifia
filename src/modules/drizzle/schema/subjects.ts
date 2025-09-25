import { pgTable, text, timestamp, uuid, vector } from 'drizzle-orm/pg-core';

export const subjectsTable = pgTable('subjects', {
  id: uuid().primaryKey().defaultRandom(),
  name: text().notNull().unique(),
  embedding: vector('embedding', { dimensions: 1024 }),
  aliasOf: uuid('alias_of').references(() => subjectsTable.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
