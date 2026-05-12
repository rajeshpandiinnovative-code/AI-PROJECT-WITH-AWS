#!/usr/bin/env node
/**
 * Verifies email + password against `platform_users` using the same DB + bcrypt as the app.
 *
 * Usage:
 *   npm run verify:email-login
 *   node scripts/verify-email-login.mjs you@example.com YourPassword
 *
 * Defaults: FOUNDER_EMAIL from .env.local (or rajeshpandi...), password FOUNDER_BOOTSTRAP_PASSWORD or PilotLocal1!
 */
import { config } from "dotenv";
import bcrypt from "bcryptjs";
import postgres from "postgres";

config({ path: ".env.local", override: true });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is missing.");
  process.exit(1);
}

const useSsl = process.env.DATABASE_SSL === "true" || process.env.DATABASE_SSL === "1";
const sql = postgres(connectionString, { max: 1, prepare: false, ...(useSsl ? { ssl: true } : {}) });

const emailArg = process.argv[2]?.trim().toLowerCase();
const passArg = process.argv[3];

const configured = (process.env.FOUNDER_EMAIL ?? "").trim().toLowerCase();
const email = emailArg || configured || "rajeshpandi.innovative@gmail.com";
const password =
  (typeof passArg === "string" && passArg.length > 0
    ? passArg
    : process.env.FOUNDER_BOOTSTRAP_PASSWORD?.trim()) || "PilotLocal1!";

try {
  const [row] = await sql`
    SELECT id::text, email, role::text, length(password_hash) AS hash_len, left(password_hash, 7) AS hash_prefix
    FROM public.platform_users
    WHERE email = ${email}
    LIMIT 1
  `;
  if (!row) {
    console.error("FAIL: No row for email:", email);
    console.error("Run: npm run seed:founder-login   (or register this email)");
    process.exit(1);
  }
  const [h] = await sql`SELECT password_hash FROM public.platform_users WHERE email = ${email} LIMIT 1`;
  const hash = h?.password_hash;
  if (!hash || typeof hash !== "string") {
    console.error("FAIL: password_hash missing for:", email);
    process.exit(1);
  }
  const ok = bcrypt.compareSync(password, hash);
  console.log("Row:", { id: row.id, email: row.email, role: row.role, hash_len: row.hash_len, hash_prefix: row.hash_prefix });
  if (ok) {
    console.log("OK: bcrypt password matches for:", email);
    process.exit(0);
  }
  console.error("FAIL: Password does not match hash for:", email);
  console.error("Re-run: npm run seed:founder-login   (or fix FOUNDER_BOOTSTRAP_PASSWORD / typed password)");
  process.exit(1);
} catch (e) {
  console.error(e);
  process.exit(1);
} finally {
  await sql.end({ timeout: 5 });
}
