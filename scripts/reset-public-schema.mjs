/**
 * DEVELOPMENT ONLY: drops `public` (all app tables) and `drizzle` (migration journal)
 * so `npm run db:migrate` can apply migrations from a clean state.
 *
 * Use when you see: incompatible types uuid and integer (legacy schools.id).
 *
 * NEVER run against production or any DB you care about.
 *
 * Usage:
 *   ALLOW_DROP_PUBLIC_SCHEMA=1 node scripts/reset-public-schema.mjs
 */
import { config } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
config({ path: path.join(REPO_ROOT, ".env.local"), override: true });

if (process.env.ALLOW_DROP_PUBLIC_SCHEMA !== "1") {
  console.error(
    "Refusing to drop schemas. Set ALLOW_DROP_PUBLIC_SCHEMA=1 if this is a disposable dev database.",
  );
  process.exit(1);
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error(`DATABASE_URL missing (${path.join(REPO_ROOT, ".env.local")}).`);
  process.exit(1);
}

const useAwsRds = connectionString.includes("rds.amazonaws.com");
const sql = postgres(connectionString, {
  max: 1,
  prepare: false,
  connect_timeout: 30,
  ...(useAwsRds ? { ssl: { rejectUnauthorized: false } } : {}),
});

try {
  console.log("Dropping schemas public + drizzle (dev reset)…");
  await sql.unsafe(`DROP SCHEMA IF EXISTS drizzle CASCADE`);
  await sql.unsafe(`DROP SCHEMA IF EXISTS public CASCADE`);
  await sql.unsafe(`CREATE SCHEMA public`);
  await sql.unsafe(`GRANT ALL ON SCHEMA public TO PUBLIC`);
  console.log("Done. Run: npm run db:migrate");
} catch (e) {
  console.error(e);
  process.exit(1);
} finally {
  await sql.end({ timeout: 10 });
}
