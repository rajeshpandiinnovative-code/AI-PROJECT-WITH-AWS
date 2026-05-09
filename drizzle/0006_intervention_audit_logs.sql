CREATE TABLE "intervention_audit_logs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "school_id" text NOT NULL,
  "action_type" varchar(64) NOT NULL,
  "affected_count" integer DEFAULT 0 NOT NULL,
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "intervention_audit_logs_school_id_idx" ON "intervention_audit_logs" USING btree ("school_id");
--> statement-breakpoint
CREATE INDEX "intervention_audit_logs_action_type_idx" ON "intervention_audit_logs" USING btree ("action_type");
