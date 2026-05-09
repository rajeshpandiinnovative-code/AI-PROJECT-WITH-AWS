CREATE TABLE IF NOT EXISTS "analytics_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_type" varchar(64) NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"ip" varchar(45),
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "analytics_events_type_created_idx" ON "analytics_events" ("event_type", "created_at" DESC);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "demo_leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"mobile" varchar(32) NOT NULL,
	"referrer" text,
	"path" varchar(512),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "demo_leads_created_idx" ON "demo_leads" ("created_at" DESC);
