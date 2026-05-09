/**
 * Apply SQL migrations in ./drizzle using postgres-js (same stack as src/lib/db.ts).
 * If tables already exist from manual setup, baselines drizzle.__drizzle_migrations first.
 *
 * Usage: node scripts/run-migrate.mjs
 */
import { config } from "dotenv";
import crypto from "node:crypto";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

// Prefer .env.local over any inherited process env (e.g. dummy DATABASE_URL from CI shells).
config({ path: ".env.local", override: true });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is missing (.env.local).");
  process.exit(1);
}

const useAwsRds = connectionString.includes("rds.amazonaws.com");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsFolder = path.join(__dirname, "..", "drizzle");

const sql = postgres(connectionString, {
  max: 1,
  prepare: false,
  connect_timeout: 30,
  idle_timeout: 20,
  onnotice: () => {},
  ...(useAwsRds ? { ssl: { rejectUnauthorized: false } } : {}),
});

const db = drizzle(sql);

function migrationHash(tag) {
  const query = fs.readFileSync(path.join(migrationsFolder, `${tag}.sql`), "utf8");
  return crypto.createHash("sha256").update(query).digest("hex");
}

async function ensureMigrationsTable() {
  await sql`CREATE SCHEMA IF NOT EXISTS drizzle`;
  await sql`
    CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
      id SERIAL PRIMARY KEY,
      hash text NOT NULL,
      created_at bigint
    )
  `;
}

async function tableExists(name) {
  const [row] = await sql`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = ${name}
    ) AS exists
  `;
  return Boolean(row?.exists);
}

async function globalSchoolsColumns() {
  const rows = await sql`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'global_schools'
  `;
  return new Set(rows.map((r) => r.column_name));
}

async function baselineIfLegacyDb() {
  await ensureMigrationsTable();

  let journalRaw = fs.readFileSync(path.join(migrationsFolder, "meta", "_journal.json"), "utf8");
  if (journalRaw.charCodeAt(0) === 0xfeff) {
    journalRaw = journalRaw.slice(1);
  }
  const journal = JSON.parse(journalRaw);

  const existingHashes = new Set(
    (await sql`SELECT hash FROM drizzle.__drizzle_migrations`).map((r) => r.hash),
  );

  async function insertBaseline(tag) {
    const entry = journal.entries.find((e) => e.tag === tag);
    if (!entry) {
      throw new Error(`Unknown migration tag: ${tag}`);
    }
    const hash = migrationHash(tag);
    if (existingHashes.has(hash)) {
      return;
    }
    await sql`
      INSERT INTO drizzle.__drizzle_migrations ("hash", "created_at")
      VALUES (${hash}, ${entry.when})
    `;
    existingHashes.add(hash);
    console.log("Baselined migration (already matches DB):", tag);
  }

  const schoolsExist = await tableExists("schools");
  const gsExist = await tableExists("global_schools");
  const gsCols = gsExist ? await globalSchoolsColumns() : new Set();
  const hasBoardType = gsCols.has("board_type");
  const hasSchoolEmail = gsCols.has("school_email");
  const hasBoardName = gsCols.has("board_name");

  if (schoolsExist) {
    await insertBaseline("0000_majestic_bushwacker");
  }
  if (gsExist) {
    await insertBaseline("0001_global_schools_directory");
  }
  if (gsExist && hasSchoolEmail && !hasBoardType) {
    await insertBaseline("0002_global_schools_columns_refresh");
  }
  if (gsExist && hasBoardName) {
    await insertBaseline("0003_global_schools_board_name");
  }
}

try {
  await baselineIfLegacyDb();
  console.log("Applying migrations from:", migrationsFolder);
  await migrate(db, { migrationsFolder });
  console.log("Migrations applied successfully.");
} catch (error) {
  console.error("Migration failed:", error);
  process.exit(1);
} finally {
  await sql.end({ timeout: 10 });
}
