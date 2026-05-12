#!/usr/bin/env node
/**
 * One-time: update an existing platform user's role (same email, no re-registration).
 *
 * Usage (from project root):
 *   node scripts/set-platform-role.mjs <email> <role>
 *
 * Example (management console):
 *   node scripts/set-platform-role.mjs you@example.com MANAGEMENT
 *
 * Example (founder / product super admin — set only for trusted accounts):
 *   node scripts/set-platform-role.mjs you@example.com SUPER_ADMIN
 *
 * Valid roles: SUPER_ADMIN, MANAGEMENT, PRINCIPAL, SCHOOL_ADMIN, TEACHER, PARENT, STUDENT
 * (.env.local is loaded for DATABASE_URL)
 */
import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local", override: true });

const ALLOWED = new Set([
  "SUPER_ADMIN",
  "MANAGEMENT",
  "PRINCIPAL",
  "SCHOOL_ADMIN",
  "TEACHER",
  "PARENT",
  "STUDENT",
]);

const emailArg = process.argv[2];
const roleArg = process.argv[3];

if (!emailArg || !roleArg) {
  console.error("Usage: node scripts/set-platform-role.mjs <email> <role>");
  console.error("Example: node scripts/set-platform-role.mjs you@example.com MANAGEMENT");
  process.exit(1);
}

const email = emailArg.trim().toLowerCase();
const role = roleArg.trim();

if (!ALLOWED.has(role)) {
  console.error(`Invalid role. Allowed: ${[...ALLOWED].join(", ")}`);
  process.exit(1);
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is missing (set in .env.local).");
  process.exit(1);
}

const sql = postgres(connectionString, { max: 1 });

try {
  const rows =
    await sql`UPDATE platform_users SET role = ${role}::platform_user_role, updated_at = NOW() WHERE email = ${email} RETURNING id, email, role`;
  if (rows.length === 0) {
    console.error(`No user found with email: ${email}`);
    process.exit(1);
  }
  console.log("Updated:", rows[0]);
  console.log("Sign out and sign in again (or clear cookies) so the dashboard shows the new role.");
} finally {
  await sql.end({ timeout: 5 });
}
