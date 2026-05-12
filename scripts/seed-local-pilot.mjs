#!/usr/bin/env node
/**
 * Inserts two fixed tenant schools + sample platform users for local multi-tenant pilot demos.
 * Idempotent on email / udise_code. Password for all pilot users: PilotLocal1!
 *
 * Usage (from repo root): npm run seed:local-pilot
 * Requires: DATABASE_URL in .env.local
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
const SCHOOL_B_ID = "b0000004-0000-4000-8000-000000000002";
const PASSWORD = "PilotLocal1!";
const passwordHash = bcrypt.hashSync(PASSWORD, 10);

const schools = [
  {
    id: SCHOOL_A_ID,
    udise: "PILOT000001",
    name: "Pilot Valluvar Vidyalaya",
    board: "CBSE",
  },
  {
    id: SCHOOL_B_ID,
    udise: "PILOT000002",
    name: "Pilot VPMM Group School",
    board: "MATRIC",
  },
];

/** email, role, schoolId, phone_number (10 digits, unique) — must match `platform_user_role` enum */
const users = [
  ["pilot-owner-a@local.test", "MANAGEMENT", SCHOOL_A_ID, "9876500001"],
  ["pilot-principal-a@local.test", "PRINCIPAL", SCHOOL_A_ID, "9876500002"],
  ["pilot-admin-a@local.test", "SCHOOL_ADMIN", SCHOOL_A_ID, "9876500003"],
  ["pilot-teacher-a@local.test", "TEACHER", SCHOOL_A_ID, "9876500004"],
  ["pilot-owner-b@local.test", "MANAGEMENT", SCHOOL_B_ID, "9876500005"],
  ["pilot-principal-b@local.test", "PRINCIPAL", SCHOOL_B_ID, "9876500006"],
  ["pilot-admin-b@local.test", "SCHOOL_ADMIN", SCHOOL_B_ID, "9876500007"],
  ["pilot-teacher-b@local.test", "TEACHER", SCHOOL_B_ID, "9876500008"],
];

try {
  for (const s of schools) {
    await sql`
      INSERT INTO public.schools (id, udise_code, name, district, board)
      VALUES (${s.id}::uuid, ${s.udise}, ${s.name}, 'Demo District', ${s.board})
      ON CONFLICT (udise_code) DO UPDATE SET
        name = EXCLUDED.name,
        board = EXCLUDED.board
    `;
    console.log("School upserted:", s.udise, s.name);
  }

  for (const [email, role, schoolId, phone] of users) {
    const displayName = email.split("@")[0].replace(/-/g, " ");
    const [row] = await sql`
      INSERT INTO public.platform_users (
        email, password_hash, role, display_name, school_id,
        is_verified, subscription_status, phone_number
      )
      VALUES (
        ${email},
        ${passwordHash},
        ${role}::platform_user_role,
        ${displayName},
        ${schoolId}::uuid,
        true,
        'trial',
        ${phone}
      )
      ON CONFLICT (email) DO UPDATE SET
        role = EXCLUDED.role,
        school_id = EXCLUDED.school_id,
        display_name = EXCLUDED.display_name,
        password_hash = EXCLUDED.password_hash,
        phone_number = EXCLUDED.phone_number
      RETURNING id
    `;
    console.log("User upserted:", email, role, phone, row?.id ?? "");
  }

  const [c1] = await sql`SELECT count(*)::int AS n FROM public.students WHERE school_id = ${SCHOOL_A_ID}::uuid`;
  const [c2] = await sql`SELECT count(*)::int AS n FROM public.students WHERE school_id = ${SCHOOL_B_ID}::uuid`;
  if (Number(c1?.n ?? 0) === 0) {
    await sql`INSERT INTO public.students (school_id, name, roll_no) VALUES (${SCHOOL_A_ID}::uuid, 'Student One A', '1')`;
  }
  if (Number(c2?.n ?? 0) === 0) {
    await sql`INSERT INTO public.students (school_id, name, roll_no) VALUES (${SCHOOL_B_ID}::uuid, 'Student One B', '1')`;
  }

  console.log("\nDone. Log in with any pilot email and password:", PASSWORD);
  console.log(
    "Dev master OTP (NODE_ENV=development): use phone on platform_users + OTP 123456 — e.g. Management School A → 9876500001",
  );
  console.log("School A id:", SCHOOL_A_ID, "| School B id:", SCHOOL_B_ID);
} catch (e) {
  console.error(e);
  process.exit(1);
} finally {
  await sql.end({ timeout: 5 });
}
