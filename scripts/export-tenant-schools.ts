/**
 * Export tenant `schools` rows (UUID + billing fields) to UTF-8 CSV for backup or migration.
 *
 * Usage: npx tsx scripts/export-tenant-schools.ts [--out ./data/export/schools-tenants.csv]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { schools } from "../src/db/schema";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
dotenv.config({ path: path.join(REPO_ROOT, ".env.local") });
dotenv.config();

function csvEscape(cell: string): string {
  if (/[",\n\r]/.test(cell)) {
    return `"${cell.replace(/"/g, '""')}"`;
  }
  return cell;
}

function line(values: string[]): string {
  return `${values.map(csvEscape).join(",")}\n`;
}

function iso(d: Date | null | undefined): string {
  if (!d) return "";
  return d.toISOString();
}

function parseCli(argv: string[]): { outPath: string } {
  let outPath = path.join(REPO_ROOT, "data", "export", `schools-tenants-${Date.now()}.csv`);
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === "--out" && argv[i + 1]) {
      outPath = path.resolve(process.cwd(), argv[i + 1]);
      i++;
    }
  }
  return { outPath };
}

async function main() {
  const { outPath } = parseCli(process.argv);
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL is missing (.env.local).");
    process.exit(1);
  }

  const sqlClient = postgres(connectionString, { max: 1, prepare: false });
  const db = drizzle(sqlClient);

  const rows = await db.select().from(schools);

  const headers = [
    "id",
    "udise_code",
    "name",
    "district",
    "board",
    "subscription_status",
    "stripe_customer_id",
    "stripe_subscription_id",
    "subscription_trial_ends_at",
    "subscription_current_period_end",
    "created_at",
    "updated_at",
  ];

  let content = line(headers);
  for (const r of rows) {
    content += line([
      r.id,
      r.udiseCode,
      r.name,
      r.district,
      r.board,
      r.subscriptionStatus,
      r.stripeCustomerId ?? "",
      r.stripeSubscriptionId ?? "",
      iso(r.subscriptionTrialEndsAt ?? undefined),
      iso(r.subscriptionCurrentPeriodEnd ?? undefined),
      iso(r.createdAt),
      iso(r.updatedAt),
    ]);
  }

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, content, "utf8");
  await sqlClient.end({ timeout: 5 });
  console.log(`Exported ${rows.length} tenant school(s) to ${path.relative(REPO_ROOT, outPath)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
