/**
 * Import / upsert tenant `schools` from CSV (same columns as export-tenant-schools.ts).
 * Upsert key: `udise_code` (stable). Existing school UUIDs are never replaced on update.
 *
 * Usage: npx tsx scripts/import-tenant-schools.ts --csv ./data/export/schools-tenants.csv
 */
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { eq } from "drizzle-orm";
import { parse } from "csv-parse/sync";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { z } from "zod";

import { schools } from "../src/db/schema";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
dotenv.config({ path: path.join(REPO_ROOT, ".env.local") });
dotenv.config();

function normHeader(h: string): string {
  return h.trim().replace(/^\uFEFF/, "").toLowerCase().replace(/\s+/g, "_");
}

function parseOptionalDate(s: string): Date | undefined {
  const t = s.trim();
  if (!t) return undefined;
  const d = new Date(t);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function normalizeUdise(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 11) return "";
  return digits.slice(0, 32);
}

function parseCli(argv: string[]): { csvPath: string } {
  let csvPath = "";
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === "--csv" && argv[i + 1]) {
      csvPath = path.resolve(process.cwd(), argv[i + 1]);
      i++;
    }
  }
  return { csvPath };
}

async function main() {
  const { csvPath } = parseCli(process.argv);
  if (!csvPath || !fs.existsSync(csvPath)) {
    console.error("Usage: npx tsx scripts/import-tenant-schools.ts --csv <path-to.csv>");
    process.exit(1);
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL is missing (.env.local).");
    process.exit(1);
  }

  const raw = fs.readFileSync(csvPath, "utf8");
  const records = parse(raw, {
    columns: (header: string[]) => header.map((h) => normHeader(h)),
    skip_empty_lines: true,
    trim: true,
    bom: true,
    relax_column_count: true,
    comment: "#",
  }) as Record<string, string>[];

  const sqlClient = postgres(connectionString, { max: 1, prepare: false });
  const db = drizzle(sqlClient);

  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  for (const row of records) {
    const udiseRaw = row.udise_code ?? row.udise ?? "";
    const udise = normalizeUdise(udiseRaw);
    if (!udise) {
      skipped++;
      continue;
    }

    const name = (row.name ?? "").trim();
    const board = (row.board ?? "").trim();
    if (!name || !board) {
      skipped++;
      continue;
    }

    const district = (row.district ?? "").trim() || "India";
    const subscriptionStatus = (row.subscription_status ?? "").trim() || "trial";
    const stripeCustomerId = (row.stripe_customer_id ?? "").trim() || null;
    const stripeSubscriptionId = (row.stripe_subscription_id ?? "").trim() || null;
    const trialEnd = parseOptionalDate(row.subscription_trial_ends_at ?? "");
    const periodEnd = parseOptionalDate(row.subscription_current_period_end ?? "");
    const createdAt = parseOptionalDate(row.created_at ?? "");
    const updatedAt = parseOptionalDate(row.updated_at ?? "");

    const idRaw = (row.id ?? "").trim();
    const idParsed = idRaw ? z.string().uuid().safeParse(idRaw) : null;
    const explicitId = idParsed?.success ? idParsed.data : undefined;

    const [existing] = await db.select().from(schools).where(eq(schools.udiseCode, udise)).limit(1);

    if (existing) {
      await db
        .update(schools)
        .set({
          name,
          district,
          board,
          subscriptionStatus,
          stripeCustomerId,
          stripeSubscriptionId,
          subscriptionTrialEndsAt: trialEnd ?? existing.subscriptionTrialEndsAt,
          subscriptionCurrentPeriodEnd: periodEnd ?? existing.subscriptionCurrentPeriodEnd,
          updatedAt: updatedAt ?? new Date(),
        })
        .where(eq(schools.id, existing.id));
      updated++;
      continue;
    }

    const newId = explicitId ?? randomUUID();
    await db.insert(schools).values({
      id: newId,
      udiseCode: udise,
      name,
      district,
      board,
      subscriptionStatus,
      stripeCustomerId,
      stripeSubscriptionId,
      subscriptionTrialEndsAt: trialEnd,
      subscriptionCurrentPeriodEnd: periodEnd,
      createdAt: createdAt ?? new Date(),
      updatedAt: updatedAt ?? new Date(),
    });
    inserted++;
  }

  await sqlClient.end({ timeout: 5 });
  console.log(`Tenant schools import done: ${inserted} inserted, ${updated} updated, ${skipped} skipped.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
