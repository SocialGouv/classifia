import type { VaeEntity } from './vae-entity.types';

export type { VaeEntity };
export type TopicAssignmentAction = 'assign_existing' | 'create_new';

export type AssignmentMethod = 'rag_agent' | 'manual' | 'clustering';

export interface TopicAssignment {
  action: TopicAssignmentAction;
  topicId: string | null;
  topicName: string;
  thematicId: string;
  thematicName: string;
  isPrimary: boolean;
  confidence: number;
  reasoning: string;
}

export interface TopicAssignmentOutput {
  assignments: TopicAssignment[];
}

export interface ClassifyOutput {
  session_id: string;
  conversation: {
    timestamp: number;
    label: string;
    confidence: number;
    semantic_context: string;
    detected_entity: VaeEntity;
  };
}

export interface TopicWithContext {
  id: string;
  name: string;
  slug: string;
  thematicId: string;
  thematicName: string;
  similarity: number;
  exampleLabels: string[];
  description?: string;
}

export interface ThematicWithTopics {
  id: string;
  name: string;
  slug: string;
  description?: string;
  topics: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
}

export interface LabelWithTopics {
  id: string;
  name: string;
  embedding: number[];
  isCanonical: boolean;
  topics: Array<{
    id: string;
    name: string;
    thematicName: string;
    isPrimary: boolean;
    confidence: number;
  }>;
}

export interface FewShotExample {
  label: string;
  semanticContext: string;
  assignments: Array<{
    topicName: string;
    thematicName: string;
    isPrimary: boolean;
    reasoning: string;
  }>;
}
