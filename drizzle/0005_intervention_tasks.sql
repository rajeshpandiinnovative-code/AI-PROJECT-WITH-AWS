CREATE TABLE "intervention_tasks" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "school_id" text NOT NULL,
  "source_result_id" uuid,
  "student_name" varchar(255) NOT NULL,
  "exam_name" varchar(255) NOT NULL,
  "marks" integer NOT NULL,
  "recommended_module" varchar(128) NOT NULL,
  "status" varchar(32) DEFAULT 'assigned' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "intervention_tasks_school_id_idx" ON "intervention_tasks" USING btree ("school_id");
--> statement-breakpoint
CREATE INDEX "intervention_tasks_status_idx" ON "intervention_tasks" USING btree ("status");
