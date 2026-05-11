#!/usr/bin/env node
/**
 * One-time: update an existing platform user's role (same email, no re-registration).
 *
 * Usage (from project root):
 *   node scripts/set-platform-role.mjs <email> <role>
 *
 * Example (founder / institution):
 *   node scripts/set-platform-role.mjs you@example.com school_org
 *
 * Example (master admin — full control, not on signup dropdown):
 *   node scripts/set-platform-role.mjs you@example.com master_admin
 *
 * Valid roles: student, parent, teacher, admin, management, school_org
 * (.env.local is loaded for DATABASE_URL)
 */
import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local", override: true });

const ALLOWED = new Set(["student", "parent", "teacher", "admin", "management", "school_org", "master_admin"]);

const emailArg = process.argv[2];
const roleArg = process.argv[3];

if (!emailArg || !roleArg) {
  console.error("Usage: node scripts/set-platform-role.mjs <email> <role>");
  console.error("Example: node scripts/set-platform-role.mjs you@example.com school_org");
  process.exit(1);
}

const email = emailArg.trim().toLowerCase();
const role = roleArg.trim().toLowerCase();

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
    await sql`UPDATE platform_users SET role = ${role}, updated_at = NOW() WHERE email = ${email} RETURNING id, email, role`;
  if (rows.length === 0) {
    console.error(`No user found with email: ${email}`);
    process.exit(1);
  }
  console.log("Updated:", rows[0]);
  console.log("Sign out and sign in again (or clear cookies) so the dashboard shows the new role.");
} finally {
  await sql.end({ timeout: 5 });
}
