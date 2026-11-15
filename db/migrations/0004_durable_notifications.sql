CREATE TABLE IF NOT EXISTS "notification_dispatches" (
	"id" text PRIMARY KEY NOT NULL,
	"idempotency_key" text NOT NULL,
	"notification_type" text NOT NULL,
	"recipient_email" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"claimed_at" timestamp,
	"lease_expires_at" timestamp,
	"next_attempt_at" timestamp,
	"provider_message_id" text,
	"last_error" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"sent_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uniq_notification_dispatches_key" ON "notification_dispatches" USING btree ("idempotency_key");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_notification_dispatches_status" ON "notification_dispatches" USING btree ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_notification_dispatches_lease" ON "notification_dispatches" USING btree ("status", "lease_expires_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_notification_dispatches_retry" ON "notification_dispatches" USING btree ("status", "next_attempt_at");
