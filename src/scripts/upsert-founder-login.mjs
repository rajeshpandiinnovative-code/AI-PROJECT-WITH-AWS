#!/usr/bin/env node
/**
 * Ensures `FOUNDER_EMAIL` (or default) exists on `platform_users` with a known bcrypt password
 * and role SUPER_ADMIN — so `/login` email + password works for `/admin`.
 *
 * Env (from .env.local):
 *   FOUNDER_EMAIL          — defaults to same fallback as `src/lib/rbac.ts`
 *   FOUNDER_BOOTSTRAP_PASSWORD — optional; default `PilotLocal1!` (same as pilot seed)
 *
 * Usage: npm run seed:founder-login
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

const configured = (process.env.FOUNDER_EMAIL ?? "").trim().toLowerCase();
const email = configured || "rajeshpandi.innovative@gmail.com";
const password = (process.env.FOUNDER_BOOTSTRAP_PASSWORD ?? "PilotLocal1!").trim() || "PilotLocal1!";
const passwordHash = bcrypt.hashSync(password, 10);

const useSsl = process.env.DATABASE_SSL === "true" || process.env.DATABASE_SSL === "1";
const sql = postgres(connectionString, {
  max: 1,
  prepare: false,
  ...(useSsl ? { ssl: true } : {}),
});

try {
  const [row] = await sql`
    INSERT INTO public.platform_users (
      email, password_hash, role, display_name,
      is_verified, subscription_status
    )
    VALUES (
      ${email},
      ${passwordHash},
      'SUPER_ADMIN'::platform_user_role,
      'Founder',
      true,
      'trial'
    )
    ON CONFLICT (email) DO UPDATE SET
      password_hash = EXCLUDED.password_hash,
      role = 'SUPER_ADMIN'::platform_user_role,
      updated_at = NOW()
    RETURNING id, email, role
  `;
  console.log("Upserted founder login row:", row);
  console.log(`Sign in at /login with email: ${email}`);
  console.log(`Password: ${password === "PilotLocal1!" ? "PilotLocal1! (default; set FOUNDER_BOOTSTRAP_PASSWORD to change)" : "(from FOUNDER_BOOTSTRAP_PASSWORD)"}`);
} catch (e) {
  console.error(e);
  process.exit(1);
} finally {
  await sql.end({ timeout: 5 });
}
