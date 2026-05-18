#!/usr/bin/env node
/**
 * Seeds 15 lesson_log entries for the pilot teacher (School A) to demo the Compliance widget.
 * Total duration: ~13.5 hours toward the 20-hour mandate.
 * Mix of mastery scores above/below 70 and varied durations.
 *
 * Idempotent: clears existing lesson_logs for the teacher before inserting.
 * Does NOT touch any other tables.
 *
 * Usage: node scripts/seed-compliance-demo.mjs
 * Requires: DATABASE_URL in .env.local
 */
import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local", override: true });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is missing (set in .env.local).");
  process.exit(1);
}

const useSsl = process.env.DATABASE_SSL === "true" || process.env.DATABASE_SSL === "1";
const sql = postgres(connectionString, {
  max: 1,
  prepare: false,
  ...(useSsl ? { ssl: true } : {}),
});

const SCHOOL_A_ID = "a0000004-0000-4000-8000-000000000001";

try {
  const [teacher] = await sql`
    SELECT id FROM public.platform_users
    WHERE school_id = ${SCHOOL_A_ID}::uuid AND role = 'TEACHER'
    LIMIT 1
  `;
  if (!teacher) {
    console.error("No teacher found for School A. Run seed-local-pilot first.");
    process.exit(1);
  }
  const teacherId = teacher.id;
  console.log("Teacher ID:", teacherId);

  const studentRows = await sql`
    SELECT id FROM public.students
    WHERE school_id = ${SCHOOL_A_ID}::uuid
    ORDER BY created_at
    LIMIT 5
  `;
  if (studentRows.length === 0) {
    console.error("No students found for School A. Run seed-local-pilot first.");
    process.exit(1);
  }
  const studentIds = studentRows.map((r) => r.id);
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  // 15 entries: durations sum to 810 min = 13.5 hours
  // Mix of compliant (>=70) and non-compliant (<70) mastery scores
  const entries = [
    { duration: 60,  mastery: 85,  skill: "CBSE-MATH-6.1" },
    { duration: 45,  mastery: 42,  skill: "CBSE-MATH-6.2" },
    { duration: 90,  mastery: 91,  skill: "CBSE-SCI-7.1" },
    { duration: 60,  mastery: 70,  skill: "CBSE-SCI-7.2" },
    { duration: 45,  mastery: 55,  skill: "CBSE-ENG-5.1" },
    { duration: 60,  mastery: 78,  skill: "CBSE-MATH-6.3" },
    { duration: 45,  mastery: 65,  skill: "CBSE-SCI-7.3" },
    { duration: 90,  mastery: 88,  skill: "CBSE-ENG-5.2" },
    { duration: 45,  mastery: 38,  skill: "CBSE-MATH-6.4" },
    { duration: 60,  mastery: 73,  skill: "CBSE-SCI-8.1" },
    { duration: 30,  mastery: 92,  skill: "CBSE-ENG-5.3" },
    { duration: 60,  mastery: 81,  skill: "CBSE-MATH-7.1" },
    { duration: 45,  mastery: 48,  skill: "CBSE-SCI-8.2" },
    { duration: 90,  mastery: 76,  skill: "CBSE-ENG-6.1" },
    { duration: 30,  mastery: 60,  skill: "CBSE-MATH-7.2" },
  ];

  const totalMin = entries.reduce((s, e) => s + e.duration, 0);
  console.log(`Seeding ${entries.length} lesson logs (${totalMin} min = ${(totalMin / 60).toFixed(1)} hrs)`);

  // Clear only this teacher's lesson_logs (safety: no other data touched)
  const deleted = await sql`
    DELETE FROM public.lesson_logs
    WHERE teacher_id = ${teacherId}::uuid AND school_id = ${SCHOOL_A_ID}::uuid
  `;
  console.log(`Cleared ${deleted.count} existing lesson_logs for this teacher.`);

  // Spread entries across the last 30 days
  const now = Date.now();
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    const isCompliant = e.mastery >= 70;
    const createdAt = new Date(now - (entries.length - i) * 2 * 24 * 60 * 60 * 1000);
    const studentId = pick(studentIds);

    await sql`
      INSERT INTO public.lesson_logs (
        school_id, teacher_id, student_id,
        cbse_skill_code, session_duration, mastery_score, is_compliant, created_at
      ) VALUES (
        ${SCHOOL_A_ID}::uuid,
        ${teacherId}::uuid,
        ${studentId}::uuid,
        ${e.skill},
        ${e.duration},
        ${e.mastery},
        ${isCompliant},
        ${createdAt}
      )
    `;
    console.log(
      `  [${i + 1}] ${e.skill}  ${e.duration}min  score=${e.mastery}  compliant=${isCompliant}`
    );
  }

  const compliant = entries.filter((e) => e.mastery >= 70).length;
  console.log(`\nDone. ${entries.length} logs inserted.`);
  console.log(`Compliant: ${compliant}/${entries.length} | Hours: ${(totalMin / 60).toFixed(1)}/20`);
  console.log(`Readiness score: ${Math.round((compliant / entries.length) * 100)}%`);
} catch (e) {
  console.error(e);
  process.exit(1);
} finally {
  await sql.end({ timeout: 5 });
}
