ALTER TABLE "conversation_labels" ADD COLUMN "conversation_timestamp" timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE "conversations" DROP COLUMN "updated_at";