ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "stripe_customer_id" varchar(255);
--> statement-breakpoint
ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "stripe_subscription_id" varchar(255);
--> statement-breakpoint
ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "subscription_status" varchar(32) DEFAULT 'trial' NOT NULL;
--> statement-breakpoint
ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "subscription_trial_ends_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "subscription_current_period_end" timestamp with time zone;
--> statement-breakpoint
UPDATE "schools"
SET
  "subscription_trial_ends_at" = COALESCE("subscription_trial_ends_at", NOW() + INTERVAL '14 days')
WHERE "subscription_trial_ends_at" IS NULL;
