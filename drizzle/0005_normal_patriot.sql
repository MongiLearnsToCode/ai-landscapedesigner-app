ALTER TABLE "user" ADD COLUMN "subscription_id" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "subscription_plan" text DEFAULT 'Free';--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "subscription_status" text DEFAULT 'active';--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "subscription_current_period_start" timestamp;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "subscription_current_period_end" timestamp;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "subscription_cancel_at_period_end" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "polar_customer_id" text;