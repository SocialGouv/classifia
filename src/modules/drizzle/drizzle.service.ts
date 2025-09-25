import { Inject } from '@nestjs/common';
import { and, eq, isNotNull, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

import { DrizzleAsyncProvider } from './drizzle.provider';
import * as schema from './schema';

export class DrizzleService {
  constructor(
    @Inject(DrizzleAsyncProvider)
    public readonly db: NodePgDatabase<typeof schema>,
  ) {}
  /**
   * Finds subjects similar to the given embedding using cosine similarity
   * @param embedding - Vector embedding to compare against
   * @param threshold - Minimum similarity threshold (0.0 to 1.0)
   * @returns Array of similar subjects with similarity scores
   */
  async findSimilarSubjects(embedding: number[], threshold: number = 0.7) {
    const result = await this.db
      .select({
        id: schema.subjectsTable.id,
        name: schema.subjectsTable.name,
        similarity: sql<number>`1 - (${schema.subjectsTable.embedding} <=> ${JSON.stringify(embedding)}::vector)`,
      })
      .from(schema.subjectsTable)
      .where(
        and(
          isNotNull(schema.subjectsTable.embedding),
          sql`1 - (${schema.subjectsTable.embedding} <=> ${JSON.stringify(embedding)}::vector) >= ${threshold}`,
        ),
      )
      .orderBy(
        sql`${schema.subjectsTable.embedding} <=> ${JSON.stringify(embedding)}::vector`,
      )
      .limit(10);

    return result;
  }

  /**
   * Creates a new subject with optional alias relationship
   * @param name - Subject name (will be normalized to lowercase)
   * @param embedding - Vector embedding for similarity matching
   * @param aliasOf - Optional parent subject ID for alias relationships
   */
  async createSubject(name: string, embedding: number[], aliasOf?: string) {
    const result = await this.db
      .insert(schema.subjectsTable)
      .values({
        name: name.toLowerCase().trim(),
        embedding,
        aliasOf: aliasOf || null,
      })
      .returning();
    return result[0];
  }

  async createConversationSubject({
    conversationId,
    subjectId,
    confidence,
    conversationTimestamp,
  }: {
    conversationId: string;
    subjectId: string;
    confidence: number;
    conversationTimestamp: Date;
  }) {
    const [conversationSubject] = await this.db
      .insert(schema.conversationSubjectsTable)
      .values({
        conversationId,
        subjectId,
        confidence,
        conversationTimestamp,
      })
      .returning();
    return conversationSubject;
  }

  async deleteConversationSubjects(conversationId: string) {
    await this.db
      .delete(schema.conversationSubjectsTable)
      .where(
        eq(schema.conversationSubjectsTable.conversationId, conversationId),
      );
  }

  async getSubjectById(id: string) {
    const [subject] = await this.db
      .select()
      .from(schema.subjectsTable)
      .where(eq(schema.subjectsTable.id, id))
      .limit(1);
    return subject;
  }

  async createConversation(crispConversationId: string, textHash: string) {
    const [conversation] = await this.db
      .insert(schema.conversationsTable)
      .values({
        crispConversationId,
        textHash,
      })
      .returning();
    return conversation;
  }

  async getConversationByCrispId(crispConversationId: string) {
    const [conversation] = await this.db
      .select()
      .from(schema.conversationsTable)
      .where(
        eq(schema.conversationsTable.crispConversationId, crispConversationId),
      )
      .limit(1);
    return conversation;
  }

  async getConversationByHash(textHash: string) {
    const [conversation] = await this.db
      .select()
      .from(schema.conversationsTable)
      .where(eq(schema.conversationsTable.textHash, textHash))
      .limit(1);
    return conversation;
  }

  async getOrCreateSkipSubject() {
    // First, try to find existing SKIP subject
    const [existingSkip] = await this.db
      .select()
      .from(schema.subjectsTable)
      .where(eq(schema.subjectsTable.name, 'skip'))
      .limit(1);

    if (existingSkip) {
      return existingSkip;
    }

    // Create new SKIP subject with null embedding (no similarity matching needed)
    const result = await this.db
      .insert(schema.subjectsTable)
      .values({
        name: 'skip',
        embedding: null, // No embedding for SKIP subjects
      })
      .returning();

    return result[0];
  }
}
