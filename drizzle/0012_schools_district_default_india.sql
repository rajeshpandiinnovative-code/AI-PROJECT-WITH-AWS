-- Nationwide launch: new tenant schools default district label (existing rows unchanged).
ALTER TABLE "schools" ALTER COLUMN "district" SET DEFAULT 'India';
