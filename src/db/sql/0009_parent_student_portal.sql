-- Parent / student platform roles, optional student login link, and parent–student associations.

-- Baseline enum when DB was created without Drizzle’s initial migration (e.g. some RDS snapshots).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'platform_user_role'
      AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.platform_user_role AS ENUM (
      'SUPER_ADMIN',
      'MANAGEMENT',
      'PRINCIPAL',
      'SCHOOL_ADMIN',
      'TEACHER',
      'PARENT',
      'STUDENT'
    );
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'platform_user_role'
      AND e.enumlabel = 'PARENT'
  ) THEN
    ALTER TYPE platform_user_role ADD VALUE 'PARENT';
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'platform_user_role'
      AND e.enumlabel = 'STUDENT'
  ) THEN
    ALTER TYPE platform_user_role ADD VALUE 'STUDENT';
  END IF;
END
$$;

ALTER TABLE platform_users
  ADD COLUMN IF NOT EXISTS linked_student_id uuid REFERENCES students (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS platform_users_linked_student_id_idx ON platform_users (linked_student_id);

CREATE TABLE IF NOT EXISTS parent_student_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
  parent_platform_user_id uuid NOT NULL REFERENCES platform_users (id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES students (id) ON DELETE CASCADE,
  school_id uuid NOT NULL REFERENCES schools (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now (),
  CONSTRAINT parent_student_links_parent_student_uq UNIQUE (parent_platform_user_id, student_id)
);

CREATE INDEX IF NOT EXISTS parent_student_links_school_id_idx ON parent_student_links (school_id);

CREATE INDEX IF NOT EXISTS parent_student_links_parent_idx ON parent_student_links (parent_platform_user_id);
