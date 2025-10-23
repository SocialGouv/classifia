import { integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const thematicsTable = pgTable('thematics', {
  id: uuid().primaryKey().defaultRandom(),
  name: text().notNull().unique(),
  slug: text().notNull().unique(),
  description: text(),
  color: text(),
  displayOrder: integer('display_order'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
