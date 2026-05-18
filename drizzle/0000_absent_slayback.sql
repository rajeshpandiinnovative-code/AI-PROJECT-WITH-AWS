CREATE TYPE "public"."user_role" AS ENUM('SUPER_ADMIN', 'MANAGEMENT', 'PRINCIPAL', 'SCHOOL_ADMIN', 'TEACHER', 'PARENT', 'STUDENT', 'GUEST');--> statement-breakpoint
CREATE TABLE "user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text,
	"email" text NOT NULL,
	"image" text,
	"role" "user_role" DEFAULT 'GUEST' NOT NULL,
	"school_id" uuid,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
