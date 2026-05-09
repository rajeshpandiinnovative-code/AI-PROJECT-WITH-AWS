CREATE TABLE "platform_users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "email" varchar(255) NOT NULL UNIQUE,
  "password_hash" varchar(255) NOT NULL,
  "role" varchar(32) NOT NULL,
  "display_name" varchar(255) NOT NULL DEFAULT '',
  "school_id" uuid REFERENCES "schools"("id") ON DELETE SET NULL,
  "stripe_customer_id" varchar(255),
  "stripe_subscription_id" varchar(255),
  "subscription_status" varchar(32) DEFAULT 'trial' NOT NULL,
  "subscription_trial_ends_at" timestamp with time zone,
  "subscription_current_period_end" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "platform_users_school_id_idx" ON "platform_users" USING btree ("school_id");
--> statement-breakpoint
CREATE INDEX "platform_users_role_idx" ON "platform_users" USING btree ("role");
