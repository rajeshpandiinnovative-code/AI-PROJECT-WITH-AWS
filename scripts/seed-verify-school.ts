/**
 * Inserts a fixed tenant row in `schools` so you can verify School ID login without onboarding.
 * Safe to run multiple times (idempotent by UDISE sentinel).
 *
 * Usage: npx tsx scripts/seed-verify-school.ts
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { schools } from "../src/db/schema";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
dotenv.config({ path: path.join(REPO_ROOT, ".env.local") });
dotenv.config();

/** Stable UUID for QA — use this string on /login → School ID. */
export const VERIFY_SCHOOL_UUID = "cafebabe-0000-4000-8000-000000000001";
/** Sentinel UDISE (11 digits) reserved for this seed; do not use for production schools. */
const VERIFY_UDISE = "44444444444";

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL is missing (.env.local).");
    process.exit(1);
  }

  const sqlClient = postgres(connectionString, { max: 1, prepare: false });
  const db = drizzle(sqlClient);

  const [byUdise] = await db.select().from(schools).where(eq(schools.udiseCode, VERIFY_UDISE)).limit(1);
  const [byId] = await db.select().from(schools).where(eq(schools.id, VERIFY_SCHOOL_UUID)).limit(1);

  if (byUdise && byUdise.id !== VERIFY_SCHOOL_UUID) {
    console.warn(
      `UDISE ${VERIFY_UDISE} already belongs to school ${byUdise.id}. Using that UUID for login instead of seed.`,
    );
    printInstructions(byUdise.id);
    await sqlClient.end({ timeout: 5 });
    return;
  }

  if (byId) {
    console.log("Verify school row already present.");
    printInstructions(byId.id);
    await sqlClient.end({ timeout: 5 });
    return;
  }

  await db.insert(schools).values({
    id: VERIFY_SCHOOL_UUID,
    udiseCode: VERIFY_UDISE,
    name: "Verification school (seed — not production)",
    district: "India",
    board: "MATRIC",
    subscriptionStatus: "trial",
  });

  console.log("Inserted verification tenant school.");
  printInstructions(VERIFY_SCHOOL_UUID);
  await sqlClient.end({ timeout: 5 });
}

function printInstructions(schoolId: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "http://localhost:3000";
  console.log("");
  console.log("── Verify School ID login ──");
  console.log(`Login URL:    ${base}/login`);
  console.log(`School ID:    ${schoolId}`);
  console.log("(Paste the UUID into “School ID (tenant)” and submit — no password.)");
  console.log("");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
