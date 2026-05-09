DROP INDEX IF EXISTS "global_schools_school_name_gin_idx";--> statement-breakpoint
ALTER TABLE "global_schools" ADD COLUMN "school_email" varchar(255);--> statement-breakpoint
ALTER TABLE "global_schools" ADD COLUMN "mobile_number" varchar(15);--> statement-breakpoint
ALTER TABLE "global_schools" ADD COLUMN "principal_name" text;--> statement-breakpoint
ALTER TABLE "global_schools" ADD COLUMN "state_name" varchar(100);--> statement-breakpoint
ALTER TABLE "global_schools" ADD COLUMN "district_name" varchar(100);--> statement-breakpoint
ALTER TABLE "global_schools" ADD COLUMN "block_name" varchar(100);--> statement-breakpoint
ALTER TABLE "global_schools" ADD COLUMN "management" varchar(100);--> statement-breakpoint
ALTER TABLE "global_schools" ADD COLUMN "category" varchar(100);--> statement-breakpoint
ALTER TABLE "global_schools" DROP COLUMN "board_type";--> statement-breakpoint
ALTER TABLE "global_schools" DROP COLUMN "district";--> statement-breakpoint
ALTER TABLE "global_schools" DROP COLUMN "taluk";--> statement-breakpoint
ALTER TABLE "global_schools" DROP COLUMN "contact_email";--> statement-breakpoint
ALTER TABLE "global_schools" DROP COLUMN "is_verified";--> statement-breakpoint
CREATE INDEX "global_schools_school_name_gin_idx" ON "global_schools" USING gin ("school_name" gin_trgm_ops);
