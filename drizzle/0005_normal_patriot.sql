ALTER TABLE "user" ADD COLUMN "subscription_id" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "subscription_plan" text DEFAULT 'Free';--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "subscription_status" text DEFAULT 'active';--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "subscription_current_period_start" timestamp;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "subscription_current_period_end" timestamp;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "subscription_cancel_at_period_end" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "polar_customer_id" text;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_subscription_id_idx" ON "user"("subscription_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_polar_customer_id_idx" ON "user"("polar_customer_id");--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_polar_customer_id_unique" UNIQUE("polar_customer_id");--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "subscription_plan" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "subscription_status" SET NOT NULL;