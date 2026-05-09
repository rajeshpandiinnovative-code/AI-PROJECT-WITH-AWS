CREATE TABLE "module_histories" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "school_id" text NOT NULL,
  "module_slug" varchar(128) NOT NULL,
  "module_title" varchar(255) NOT NULL,
  "input_data" jsonb NOT NULL,
  "output_data" jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "module_histories_school_id_idx" ON "module_histories" USING btree ("school_id");
--> statement-breakpoint
CREATE INDEX "module_histories_module_slug_idx" ON "module_histories" USING btree ("module_slug");
