/**
 * RDS / pilot health check: connectivity, enum labels, and rollout counts.
 *
 * Usage (from repo root): npx tsx scripts/verify-pilot-health.ts
 * Loads DATABASE_URL from .env.local via dotenv.
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
const sql = postgres(connectionString, {
  max: 1,
  prepare: false,
  ...(useSsl ? { ssl: true } : {}),
});

async function main() {
  console.log("--- Rollout Readiness Report ---\n");

  const [sample] = await sql`SELECT udise_code, school_name FROM global_schools LIMIT 1`;
  if (!sample) {
    console.log("Connectivity: OK (query ran) — global_schools returned 0 rows.");
  } else {
    console.log(
      "Connectivity: OK — sample global_schools row:",
      sample.udise_code,
      String(sample.school_name ?? "").slice(0, 48),
    );
  }

  const enumRows = await sql`
    SELECT e.enumlabel AS label
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'platform_user_role'
    ORDER BY e.enumsortorder
  `;

  const labels = enumRows.map((r) => String(r.label));
  const hasManagement = labels.includes("MANAGEMENT");
  const hasPrincipal = labels.includes("PRINCIPAL");

  console.log("\nplatform_user_role enum labels:", labels.length ? labels.join(", ") : "(none — migration not applied?)");
  console.log("  MANAGEMENT present:", hasManagement ? "yes" : "NO");
  console.log("  PRINCIPAL present:", hasPrincipal ? "yes" : "NO");

  const [schoolsRow] = await sql`SELECT count(*)::int AS n FROM schools`;
  const [usersRow] = await sql`SELECT count(*)::int AS n FROM platform_users`;
  const [interventionsRow] = await sql`SELECT count(*)::int AS n FROM intervention_tasks`;

  console.log("\n--- Counts ---");
  console.log("Schools (tenants):     ", Number(schoolsRow?.n ?? 0));
  console.log("Platform users:      ", Number(usersRow?.n ?? 0));
  console.log("Intervention tasks:  ", Number(interventionsRow?.n ?? 0));

  const ready = hasManagement && hasPrincipal && labels.length > 0;
  console.log("\n--- Summary ---");
  console.log(ready ? "Status: READY for pilot (enum + connectivity)." : "Status: REVIEW REQUIRED (enum or data).");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await sql.end({ timeout: 5 });
  });
