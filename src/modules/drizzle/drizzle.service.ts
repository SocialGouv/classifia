import { Inject } from '@nestjs/common';
import { and, eq, isNotNull, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

import { VaeEntity } from '../conversations/types/vae-entity.types';

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
    conversationHash,
  }: {
    conversationId: string;
    subjectId: string;
    confidence: number;
    conversationTimestamp: Date;
    conversationHash: string;
  }) {
    const [conversationSubject] = await this.db
      .insert(schema.conversationSubjectsTable)
      .values({
        conversationId,
        subjectId,
        confidence,
        conversationTimestamp,
        conversationHash,
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

  async getConversationSubjectByDiscussionHash(conversationHash: string) {
    const [row] = await this.db
      .select()
      .from(schema.conversationSubjectsTable)
      .where(
        eq(schema.conversationSubjectsTable.conversationHash, conversationHash),
      )
      .limit(1);
    return row;
  }

  // ============================================================
  // Hierarchical Classification Methods
  // ============================================================

  /**
   * Creates a new thematic category
   */
  async createThematic({
    name,
    slug,
    description,
    color,
    displayOrder,
  }: {
    name: string;
    slug: string;
    description?: string;
    color?: string;
    displayOrder?: number;
  }) {
    const [thematic] = await this.db
      .insert(schema.thematicsTable)
      .values({
        name,
        slug,
        description: description || null,
        color: color || null,
        displayOrder: displayOrder || null,
      })
      .returning();
    return thematic;
  }

  /**
   * Gets all thematics
   */
  async getAllThematics() {
    return await this.db
      .select()
      .from(schema.thematicsTable)
      .orderBy(schema.thematicsTable.displayOrder);
  }

  /**
   * Gets a thematic by ID
   */
  async getThematicById(id: string) {
    const [thematic] = await this.db
      .select()
      .from(schema.thematicsTable)
      .where(eq(schema.thematicsTable.id, id))
      .limit(1);
    return thematic;
  }

  /**
   * Creates a new topic within a thematic
   */
  async createTopic({
    thematicId,
    name,
    slug,
    embedding,
    description,
  }: {
    thematicId: string;
    name: string;
    slug: string;
    embedding?: number[];
    description?: string;
  }) {
    const [topic] = await this.db
      .insert(schema.topicsTable)
      .values({
        thematicId,
        name,
        slug,
        embedding: embedding || null,
        description: description || null,
      })
      .returning();
    return topic;
  }

  /**
   * Finds topics similar to the given embedding using cosine similarity
   */
  async findSimilarTopics(
    embedding: number[],
    threshold: number = 0.7,
    limit: number = 5,
  ) {
    const result = await this.db
      .select({
        id: schema.topicsTable.id,
        name: schema.topicsTable.name,
        slug: schema.topicsTable.slug,
        thematicId: schema.topicsTable.thematicId,
        thematicName: schema.thematicsTable.name,
        similarity: sql<number>`1 - (${schema.topicsTable.embedding} <=> ${JSON.stringify(embedding)}::vector)`,
      })
      .from(schema.topicsTable)
      .leftJoin(
        schema.thematicsTable,
        eq(schema.topicsTable.thematicId, schema.thematicsTable.id),
      )
      .where(
        and(
          isNotNull(schema.topicsTable.embedding),
          sql`1 - (${schema.topicsTable.embedding} <=> ${JSON.stringify(embedding)}::vector) >= ${threshold}`,
        ),
      )
      .orderBy(
        sql`${schema.topicsTable.embedding} <=> ${JSON.stringify(embedding)}::vector`,
      )
      .limit(limit);

    return result;
  }

  /**
   * Gets all topics for a thematic
   */
  async getTopicsByThematicId(thematicId: string) {
    return await this.db
      .select()
      .from(schema.topicsTable)
      .where(eq(schema.topicsTable.thematicId, thematicId));
  }

  /**
   * Gets all topics with their thematics
   */
  async getAllTopicsWithThematics() {
    return await this.db
      .select({
        id: schema.topicsTable.id,
        name: schema.topicsTable.name,
        slug: schema.topicsTable.slug,
        thematicId: schema.topicsTable.thematicId,
        thematicName: schema.thematicsTable.name,
        thematicSlug: schema.thematicsTable.slug,
      })
      .from(schema.topicsTable)
      .leftJoin(
        schema.thematicsTable,
        eq(schema.topicsTable.thematicId, schema.thematicsTable.id),
      )
      .orderBy(schema.thematicsTable.displayOrder, schema.topicsTable.name);
  }

  /**
   * Gets a topic by ID
   */
  async getTopicById(id: string) {
    const [topic] = await this.db
      .select()
      .from(schema.topicsTable)
      .where(eq(schema.topicsTable.id, id))
      .limit(1);
    return topic;
  }

  /**
   * Creates a new label
   */
  async createLabel({
    name,
    embedding,
    isCanonical,
  }: {
    name: string;
    embedding: number[];
    isCanonical?: boolean;
  }) {
    const [label] = await this.db
      .insert(schema.labelsTable)
      .values({
        name: name.toLowerCase().trim(),
        embedding,
        isCanonical: isCanonical || false,
      })
      .returning();
    return label;
  }

  /**
   * Finds labels similar to the given embedding
   */
  async findSimilarLabels(
    embedding: number[],
    threshold: number = 0.92,
    limit: number = 10,
  ) {
    const result = await this.db
      .select({
        id: schema.labelsTable.id,
        name: schema.labelsTable.name,
        isCanonical: schema.labelsTable.isCanonical,
        similarity: sql<number>`1 - (${schema.labelsTable.embedding} <=> ${JSON.stringify(embedding)}::vector)`,
      })
      .from(schema.labelsTable)
      .where(
        and(
          sql`1 - (${schema.labelsTable.embedding} <=> ${JSON.stringify(embedding)}::vector) >= ${threshold}`,
          sql`1 - (${schema.labelsTable.embedding} <=> ${JSON.stringify(embedding)}::vector) IS NOT NULL`,
        ),
      )
      .orderBy(
        sql`${schema.labelsTable.embedding} <=> ${JSON.stringify(embedding)}::vector`,
      )
      .limit(limit);

    return result;
  }

  /**
   * Gets a label by name
   */
  async getLabelByName(name: string) {
    const [label] = await this.db
      .select()
      .from(schema.labelsTable)
      .where(eq(schema.labelsTable.name, name.toLowerCase().trim()))
      .limit(1);
    return label;
  }

  /**
   * Gets a label by ID
   */
  async getLabelById(id: string) {
    const [label] = await this.db
      .select()
      .from(schema.labelsTable)
      .where(eq(schema.labelsTable.id, id))
      .limit(1);
    return label;
  }

  /**
   * Links a label to a topic (upsert behavior)
   */
  async linkLabelToTopic({
    labelId,
    topicId,
    confidence,
    isPrimary,
    assignmentMethod,
  }: {
    labelId: string;
    topicId: string;
    confidence?: number;
    isPrimary?: boolean;
    assignmentMethod?: string;
  }) {
    // Check if the relationship already exists
    const existing = await this.db
      .select()
      .from(schema.labelTopicsTable)
      .where(
        and(
          eq(schema.labelTopicsTable.labelId, labelId),
          eq(schema.labelTopicsTable.topicId, topicId),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      // Update existing relationship
      const [updated] = await this.db
        .update(schema.labelTopicsTable)
        .set({
          confidence: confidence || 1.0,
          isPrimary: isPrimary ?? true,
          assignmentMethod: assignmentMethod || 'manual',
        })
        .where(
          and(
            eq(schema.labelTopicsTable.labelId, labelId),
            eq(schema.labelTopicsTable.topicId, topicId),
          ),
        )
        .returning();
      return updated;
    }

    // Create new relationship
    const [labelTopic] = await this.db
      .insert(schema.labelTopicsTable)
      .values({
        labelId,
        topicId,
        confidence: confidence || 1.0,
        isPrimary: isPrimary ?? true,
        assignmentMethod: assignmentMethod || 'manual',
      })
      .returning();
    return labelTopic;
  }

  /**
   * Gets example labels for a topic (for RAG context)
   */
  async getExampleLabelsForTopic(topicId: string, limit: number = 5) {
    const result = await this.db
      .select({
        labelName: schema.labelsTable.name,
        confidence: schema.labelTopicsTable.confidence,
        isPrimary: schema.labelTopicsTable.isPrimary,
      })
      .from(schema.labelTopicsTable)
      .innerJoin(
        schema.labelsTable,
        eq(schema.labelTopicsTable.labelId, schema.labelsTable.id),
      )
      .where(eq(schema.labelTopicsTable.topicId, topicId))
      .orderBy(schema.labelTopicsTable.confidence)
      .limit(limit);

    return result.map((r) => r.labelName);
  }

  /**
   * Creates a new session
   */
  async createSession(crispConversationId: string, textHash: string) {
    const [session] = await this.db
      .insert(schema.sessionsTable)
      .values({
        crispConversationId,
        textHash,
      })
      .returning();
    return session;
  }

  /**
   * Gets a session by Crisp ID
   */
  async getSessionByCrispId(crispConversationId: string) {
    const [session] = await this.db
      .select()
      .from(schema.sessionsTable)
      .where(eq(schema.sessionsTable.crispConversationId, crispConversationId))
      .limit(1);
    return session;
  }

  /**
   * Gets a session by hash
   */
  async getSessionByHash(textHash: string) {
    const [session] = await this.db
      .select()
      .from(schema.sessionsTable)
      .where(eq(schema.sessionsTable.textHash, textHash))
      .limit(1);
    return session;
  }

  /**
   * Creates a new discussion
   */
  async createDiscussion({
    sessionId,
    timestamp,
    contentHash,
  }: {
    sessionId: string;
    timestamp: Date;
    contentHash: string;
  }) {
    const [discussion] = await this.db
      .insert(schema.discussionsTable)
      .values({
        sessionId,
        timestamp,
        contentHash,
      })
      .returning();
    return discussion;
  }

  /**
   * Gets a discussion by content hash
   */
  async getDiscussionByContentHash(contentHash: string) {
    const [discussion] = await this.db
      .select()
      .from(schema.discussionsTable)
      .where(eq(schema.discussionsTable.contentHash, contentHash))
      .limit(1);
    return discussion;
  }

  /**
   * Creates a discussion classification
   */
  async createDiscussionClassification({
    discussionId,
    labelId,
    confidence,
    discussionTimestamp,
    discussionHash,
    classificationMethod,
    detectedEntity,
  }: {
    discussionId: string;
    labelId: string;
    confidence: number;
    discussionTimestamp: Date;
    discussionHash: string;
    classificationMethod?: string;
    detectedEntity?: VaeEntity;
  }) {
    const [classification] = await this.db
      .insert(schema.discussionClassificationsTable)
      .values({
        discussionId,
        labelId,
        confidence,
        discussionTimestamp,
        discussionHash,
        classificationMethod: classificationMethod || 'ai_agent',
        detectedEntity: detectedEntity || 'non_identifie',
      })
      .returning();
    return classification;
  }

  /**
   * Gets a discussion classification by discussion hash
   */
  async getDiscussionClassificationByHash(discussionHash: string) {
    const [classification] = await this.db
      .select()
      .from(schema.discussionClassificationsTable)
      .where(
        eq(
          schema.discussionClassificationsTable.discussionHash,
          discussionHash,
        ),
      )
      .limit(1);
    return classification;
  }

  /**
   * Gets or creates a SKIP label
   */
  async getOrCreateSkipLabel() {
    const existing = await this.getLabelByName('skip');
    if (existing) {
      return existing;
    }

    // Create SKIP label with a deterministic embedding to avoid NaN similarity
    // Using a small constant vector ensures cosine similarity calculations work properly
    const skipEmbedding = new Array(1024).fill(0.001);
    return await this.createLabel({
      name: 'skip',
      embedding: skipEmbedding,
      isCanonical: true,
    });
  }
}
