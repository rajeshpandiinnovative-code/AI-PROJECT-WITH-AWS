CREATE TABLE "global_schools" (
	"udise_code" varchar(11) PRIMARY KEY NOT NULL,
	"school_name" text NOT NULL,
	"board_type" text NOT NULL,
	"district" text DEFAULT 'Virudhunagar' NOT NULL,
	"taluk" text DEFAULT 'Srivilliputhur' NOT NULL,
	"pincode" varchar(6),
	"contact_email" text,
	"is_verified" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS pg_trgm;
--> statement-breakpoint
CREATE INDEX "global_schools_school_name_gin_idx" ON "global_schools" USING gin ("school_name" gin_trgm_ops);