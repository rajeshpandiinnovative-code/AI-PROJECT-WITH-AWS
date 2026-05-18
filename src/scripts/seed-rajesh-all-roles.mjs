#!/usr/bin/env node
/**
 * Dummy `platform_users` — one row per `platform_user_role`, display name Rajesh.
 *
 * `phone_number` is UNIQUE: only TEACHER uses 9535761292 (mobile OTP). Other rows
 * use NULL phone; sign in with email + password (same as pilot seed).
 *
 * Usage: npm run seed:rajesh-all-roles
 * Requires: DATABASE_URL in .env.local — run `npm run seed:local-pilot` first so School A + a student exist.
 */
import { config } from "dotenv";
import bcrypt from "bcryptjs";
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
const DISPLAY_NAME = "Rajesh";
const PHONE_OTP = "9535761292";
const PASSWORD = "PilotLocal1!";
const passwordHash = bcrypt.hashSync(PASSWORD, 10);

/** One stable email per enum role (idempotent upserts). */
const ROLE_ROWS = [
  { role: "SUPER_ADMIN", email: "rajesh.dummy.superadmin@local.test", phone: null },
  { role: "MANAGEMENT", email: "rajesh.dummy.management@local.test", phone: null },
  { role: "PRINCIPAL", email: "rajesh.dummy.principal@local.test", phone: null },
  { role: "SCHOOL_ADMIN", email: "rajesh.dummy.schooladmin@local.test", phone: null },
  { role: "TEACHER", email: "rajesh.dummy.teacher@local.test", phone: PHONE_OTP },
  { role: "PARENT", email: "rajesh.dummy.parent@local.test", phone: null },
  { role: "STUDENT", email: "rajesh.dummy.student@local.test", phone: null },
];

try {
  const [school] = await sql`
    SELECT id::text AS id FROM public.schools WHERE id = ${SCHOOL_A_ID}::uuid LIMIT 1
  `;
  if (!school) {
    console.error("School A not found. Run: npm run seed:local-pilot");
    process.exit(1);
  }

  let studentId = null;
  const [st] = await sql`
    SELECT id::text AS id FROM public.students WHERE school_id = ${SCHOOL_A_ID}::uuid ORDER BY created_at LIMIT 1
  `;
  if (st?.id) {
    studentId = st.id;
  } else {
    const [ins] = await sql`
      INSERT INTO public.students (school_id, name, roll_no)
      VALUES (${SCHOOL_A_ID}::uuid, 'Rajesh Demo Student', 'RD-1')
      RETURNING id::text AS id
    `;
    studentId = ins?.id ?? null;
  }
  if (!studentId) {
    console.error("Could not resolve a student row for STUDENT role.");
    process.exit(1);
  }

  for (const { role, email, phone } of ROLE_ROWS) {
    const linkedStudentId = role === "STUDENT" ? studentId : null;
    await sql`
      INSERT INTO public.platform_users (
        email, password_hash, role, display_name, school_id,
        is_verified, subscription_status, phone_number, board,
        linked_student_id
      )
      VALUES (
        ${email},
        ${passwordHash},
        ${role}::platform_user_role,
        ${DISPLAY_NAME},
        ${SCHOOL_A_ID}::uuid,
        true,
        'trial',
        ${phone},
        'MATRIC',
        ${linkedStudentId}
      )
      ON CONFLICT (email) DO UPDATE SET
        role = EXCLUDED.role,
        school_id = EXCLUDED.school_id,
        display_name = EXCLUDED.display_name,
        password_hash = EXCLUDED.password_hash,
        phone_number = EXCLUDED.phone_number,
        board = EXCLUDED.board,
        linked_student_id = EXCLUDED.linked_student_id
    `;
    console.log("Upserted:", role, email, phone ? `phone ${phone}` : "phone null");
  }

  const [parent] = await sql`
    SELECT id::text AS id FROM public.platform_users WHERE email = 'rajesh.dummy.parent@local.test' LIMIT 1
  `;
  if (parent?.id) {
    await sql`
      INSERT INTO public.parent_student_links (parent_platform_user_id, student_id, school_id)
      VALUES (${parent.id}::uuid, ${studentId}::uuid, ${SCHOOL_A_ID}::uuid)
      ON CONFLICT (parent_platform_user_id, student_id) DO NOTHING
    `;
    console.log("Parent ↔ student link ensured (may already exist).");
  }

  console.log("\nDone.");
  console.log(`Mobile OTP login (dev master OTP if enabled): phone ${PHONE_OTP} — role TEACHER`);
  console.log(`All accounts password: ${PASSWORD}`);
  console.log(
    "Note: SUPER_ADMIN in DB becomes SCHOOL_ADMIN in JWT unless email matches FOUNDER_EMAIL (see auth.ts).",
  );
} catch (e) {
  console.error(e);
  process.exit(1);
} finally {
  await sql.end({ timeout: 5 });
}
