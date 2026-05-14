-- Create lesson_logs table for CBSE compliance engine
CREATE TABLE IF NOT EXISTS public.lesson_logs (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  school_id   UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  teacher_id  UUID NOT NULL REFERENCES public.platform_users(id) ON DELETE CASCADE,
  student_id  UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  cbse_skill_code VARCHAR(64) NOT NULL,
  session_duration INTEGER NOT NULL,
  mastery_score DOUBLE PRECISION NOT NULL,
  is_compliant BOOLEAN NOT NULL
);

CREATE INDEX IF NOT EXISTS lesson_logs_school_id_idx ON public.lesson_logs (school_id);
CREATE INDEX IF NOT EXISTS lesson_logs_teacher_id_idx ON public.lesson_logs (teacher_id);
CREATE INDEX IF NOT EXISTS lesson_logs_student_id_idx ON public.lesson_logs (student_id);
