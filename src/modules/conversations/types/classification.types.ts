/**
 * Classification action types based on similarity thresholds
 */
export type ClassificationAction =
  | 'skip_classification' // Conversation marked as SKIP
  | 'reuse_existing' // Similarity >= 0.85, reuse existing subject
  | 'suggest_grouping' // Similarity 0.70-0.85, create alias
  | 'create_new_subject' // Similarity < 0.70, create new subject
  | 'no_embedding' // No embedding available
  | 'reused_existing_subject' // Final action after processing
  | 'created_alias_subject' // Final action after processing
  | 'created_new_subject'; // Final action after processing

/**
 * Similarity thresholds for classification decisions
 */
export const SIMILARITY_THRESHOLDS = {
  REUSE_EXISTING: 0.85,
  SUGGEST_GROUPING: 0.7,
} as const;
