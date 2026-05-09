ALTER TABLE "global_schools" ADD COLUMN "board_name" text;--> statement-breakpoint
CREATE INDEX "global_schools_board_name_idx" ON "global_schools" USING btree ("board_name");
