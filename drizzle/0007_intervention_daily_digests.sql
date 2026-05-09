CREATE TABLE "intervention_daily_digests" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "school_id" text NOT NULL,
  "digest_date" date NOT NULL,
  "summary" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "intervention_daily_digests_school_id_idx" ON "intervention_daily_digests" USING btree ("school_id");
--> statement-breakpoint
CREATE INDEX "intervention_daily_digests_digest_date_idx" ON "intervention_daily_digests" USING btree ("digest_date");
