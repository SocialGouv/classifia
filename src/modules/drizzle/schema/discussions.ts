import { index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { sessionsTable } from './sessions';

export const discussionsTable = pgTable(
  'discussions',
  {
    id: uuid().primaryKey().defaultRandom(),
    sessionId: uuid('session_id')
      .notNull()
      .references(() => sessionsTable.id, { onDelete: 'cascade' }),
    timestamp: timestamp('timestamp').notNull(),
    contentHash: text('content_hash').notNull().unique(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [index('idx_discussions_session').on(table.sessionId)],
);
