-- School Admin SIS fields + per-grade module visibility (tenant-scoped).
ALTER TABLE students
  ADD COLUMN IF NOT EXISTS section varchar(64),
  ADD COLUMN IF NOT EXISTS board_registration_no varchar(128);

CREATE TABLE IF NOT EXISTS school_module_grade_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools (id) ON DELETE CASCADE,
  grade_label varchar(64) NOT NULL,
  module_slug varchar(128) NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT school_module_grade_policies_unique UNIQUE (school_id, grade_label, module_slug)
);

CREATE INDEX IF NOT EXISTS school_module_grade_policies_school_idx ON school_module_grade_policies (school_id);
