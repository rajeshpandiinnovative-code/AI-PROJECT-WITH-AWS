CREATE TABLE "exams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"date" date NOT NULL,
	"school_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"exam_id" uuid NOT NULL,
	"marks" integer NOT NULL,
	"school_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "schools" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"udise_code" varchar(32) NOT NULL,
	"name" varchar(255) NOT NULL,
	"district" varchar(128) DEFAULT 'Virudhunagar' NOT NULL,
	"board" varchar(128) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "schools_udise_code_unique" UNIQUE("udise_code")
);
--> statement-breakpoint
CREATE TABLE "students" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"roll_no" varchar(64) NOT NULL,
	"school_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "exams" ADD CONSTRAINT "exams_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "results" ADD CONSTRAINT "results_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "results" ADD CONSTRAINT "results_exam_id_exams_id_fk" FOREIGN KEY ("exam_id") REFERENCES "public"."exams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "results" ADD CONSTRAINT "results_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "exams_school_id_idx" ON "exams" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "results_school_id_idx" ON "results" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "students_school_id_idx" ON "students" USING btree ("school_id");