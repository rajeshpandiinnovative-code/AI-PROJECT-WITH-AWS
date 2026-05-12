#!/usr/bin/env node
/**
 * Apply idempotent SQL files from ./sql in lexical order (0004_*.sql, …).
 * Records applied filenames in public._aap_sql_migrations so each file runs once.
 *
 * Usage (from project root): npm run db:migrate
 */
import { config } from "dotenv";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

config({ path: ".env.local", override: true });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is missing (set in .env.local).");
  process.exit(1);
}

const useSsl = process.env.DATABASE_SSL === "true" || process.env.DATABASE_SSL === "1";
const useAwsRds = connectionString.includes("rds.amazonaws.com");

const sql = postgres(connectionString, {
  max: 1,
  prepare: false,
  connect_timeout: 30,
  idle_timeout: 20,
  onnotice: () => {},
  ...(useSsl || useAwsRds ? { ssl: useAwsRds ? { rejectUnauthorized: false } : true } : {}),
});

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sqlDir = path.join(__dirname, "..", "sql");

async function ensureLedger() {
  await sql`
    CREATE TABLE IF NOT EXISTS public._aap_sql_migrations (
      filename text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `;
}

async function appliedSet() {
  const rows = await sql`SELECT filename FROM public._aap_sql_migrations`;
  return new Set(rows.map((r) => r.filename));
}

function listSqlFiles() {
  if (!fs.existsSync(sqlDir)) {
    return [];
  }
  return fs
    .readdirSync(sqlDir)
    .filter((f) => f.endsWith(".sql"))
    .sort((a, b) => a.localeCompare(b, "en"));
}

/** When the DB was migrated manually, CREATE TABLE can still error; skip + baseline the ledger. */
async function migrationAlreadySatisfied(filename) {
  if (filename === "0004_demo_sessions.sql") {
    const [r] = await sql`SELECT to_regclass('public.demo_sessions') IS NOT NULL AS ok`;
    return Boolean(r?.ok);
  }
  if (filename === "0005_revenue_events.sql") {
    const [r] = await sql`SELECT to_regclass('public.revenue_events') IS NOT NULL AS ok`;
    return Boolean(r?.ok);
  }
  if (filename === "0006_platform_users_phone_otp.sql") {
    const [r] = await sql`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'platform_users' AND column_name = 'phone_number'
      ) AS ok
    `;
    return Boolean(r?.ok);
  }
  if (filename === "0007_app_settings.sql") {
    const [r] = await sql`SELECT to_regclass('public.app_settings') IS NOT NULL AS ok`;
    return Boolean(r?.ok);
  }
  if (filename === "0008_school_admin_extensions.sql") {
    const [r] = await sql`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'students' AND column_name = 'board_registration_no'
      ) AS ok
    `;
    return Boolean(r?.ok);
  }
  if (filename === "0009_parent_student_portal.sql") {
    const [r] = await sql`SELECT to_regclass('public.parent_student_links') IS NOT NULL AS ok`;
    return Boolean(r?.ok);
  }
  return false;
}

try {
  await ensureLedger();
  const done = await appliedSet();
  const files = listSqlFiles();
  if (files.length === 0) {
    console.log("No .sql files in ./sql — nothing to do.");
    process.exit(0);
  }

  for (const name of files) {
    if (done.has(name)) {
      console.log("Skip (already applied):", name);
      continue;
    }
    const full = path.join(sqlDir, name);
    const body = fs.readFileSync(full, "utf8").trim();
    if (!body) {
      console.warn("Empty file, recording as applied:", name);
      await sql`INSERT INTO public._aap_sql_migrations (filename) VALUES (${name})`;
      continue;
    }

    if (await migrationAlreadySatisfied(name)) {
      console.log("Skip (schema already matches), recording:", name);
      await sql`INSERT INTO public._aap_sql_migrations (filename) VALUES (${name})`;
      continue;
    }

    console.log("Applying:", name);
    await sql.unsafe(body);
    await sql`INSERT INTO public._aap_sql_migrations (filename) VALUES (${name})`;
    console.log("Applied:", name);
  }

  console.log("Migrations finished successfully.");
} catch (err) {
  console.error("Migration failed:", err);
  process.exit(1);
} finally {
  await sql.end({ timeout: 10 });
}
