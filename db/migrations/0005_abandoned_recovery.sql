ALTER TABLE "notification_dispatches" ADD COLUMN IF NOT EXISTS "claimed_at" timestamp;
--> statement-breakpoint
ALTER TABLE "notification_dispatches" ADD COLUMN IF NOT EXISTS "lease_expires_at" timestamp;
--> statement-breakpoint
ALTER TABLE "notification_dispatches" ADD COLUMN IF NOT EXISTS "next_attempt_at" timestamp;
--> statement-breakpoint
ALTER TABLE "notification_dispatches" ADD COLUMN IF NOT EXISTS "provider_message_id" text;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_notification_dispatches_lease" ON "notification_dispatches" USING btree ("status", "lease_expires_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_notification_dispatches_retry" ON "notification_dispatches" USING btree ("status", "next_attempt_at");

