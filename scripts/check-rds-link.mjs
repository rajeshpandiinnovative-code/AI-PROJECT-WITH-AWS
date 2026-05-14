#!/usr/bin/env node
/**
 * Monday-morning RDS connectivity check.
 * Verifies: DNS resolution, TCP connect, SSL handshake, and a simple SELECT 1 query.
 * Run from the school's network to confirm the IP is whitelisted in RDS security group.
 *
 * Usage: node scripts/check-rds-link.mjs
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

let hostName = "unknown";
try {
  const url = new URL(connectionString);
  hostName = url.hostname;
} catch {
  const match = connectionString.match(/@([^:/]+)/);
  if (match) hostName = match[1];
}

console.log("──────────────────────────────────────────────");
console.log("  AI Academy Pro — RDS Connectivity Check");
console.log("──────────────────────────────────────────────");
console.log(`  Host:     ${hostName}`);
console.log(`  SSL:      ${useSsl ? "enabled" : "disabled"}`);
console.log(`  Time:     ${new Date().toLocaleString()}`);
console.log("──────────────────────────────────────────────\n");

const checks = [];
const sql = postgres(connectionString, {
  max: 1,
  prepare: false,
  idle_timeout: 10,
  connect_timeout: 15,
  ...(useSsl ? { ssl: true } : {}),
});

try {
  console.log("[1/4] TCP + SSL handshake …");
  const t0 = Date.now();
  const [row] = await sql`SELECT 1 AS ok`;
  const latency = Date.now() - t0;
  if (row?.ok === 1) {
    checks.push({ name: "TCP + SSL", status: "OK", detail: `${latency}ms` });
    console.log(`  ✓ Connected in ${latency}ms\n`);
  } else {
    throw new Error("Unexpected query result");
  }

  console.log("[2/4] Database version …");
  const [ver] = await sql`SELECT version() AS v`;
  const version = String(ver?.v ?? "").split(" ").slice(0, 2).join(" ");
  checks.push({ name: "DB Version", status: "OK", detail: version });
  console.log(`  ✓ ${version}\n`);

  console.log("[3/4] Schema check (lesson_logs) …");
  const [tableCheck] = await sql`
    SELECT count(*)::int AS n
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'lesson_logs'
  `;
  const tableExists = Number(tableCheck?.n ?? 0) > 0;
  checks.push({ name: "lesson_logs table", status: tableExists ? "OK" : "MISSING", detail: tableExists ? "exists" : "NOT FOUND" });
  console.log(`  ${tableExists ? "✓" : "✗"} lesson_logs: ${tableExists ? "exists" : "NOT FOUND — run migration"}\n`);

  console.log("[4/4] Row count (lesson_logs) …");
  if (tableExists) {
    const [ct] = await sql`SELECT count(*)::int AS n FROM public.lesson_logs`;
    const rowCount = Number(ct?.n ?? 0);
    checks.push({ name: "lesson_logs rows", status: "OK", detail: `${rowCount} rows` });
    console.log(`  ✓ ${rowCount} rows\n`);
  } else {
    checks.push({ name: "lesson_logs rows", status: "SKIP", detail: "table missing" });
    console.log("  — skipped (table missing)\n");
  }
} catch (e) {
  const msg = e instanceof Error ? e.message : String(e);
  checks.push({ name: "Connection", status: "FAIL", detail: msg });
  console.error(`  ✗ FAILED: ${msg}\n`);
} finally {
  await sql.end({ timeout: 5 });
}

console.log("──────────────── SUMMARY ─────────────────────");
for (const c of checks) {
  const icon = c.status === "OK" ? "✓" : c.status === "SKIP" ? "—" : "✗";
  console.log(`  ${icon} ${c.name.padEnd(22)} ${c.status.padEnd(8)} ${c.detail}`);
}
const allOk = checks.every((c) => c.status === "OK" || c.status === "SKIP");
console.log(`\n  ${allOk ? "🟢 All checks passed — ready for pilot." : "🔴 Issues detected — review above."}`);
console.log("──────────────────────────────────────────────");
process.exit(allOk ? 0 : 1);
