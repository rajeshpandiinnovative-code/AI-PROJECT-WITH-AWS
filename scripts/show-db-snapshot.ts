/**
 * Print tenant schools (+ counts) from the connected database (read-only).
 * Usage: npx tsx scripts/show-db-snapshot.ts
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { asc, count } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { globalSchools, platformUsers, schools } from "../src/db/schema";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
dotenv.config({ path: path.join(REPO_ROOT, ".env.local"), override: true });
dotenv.config();

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error(`DATABASE_URL missing (${path.join(REPO_ROOT, ".env.local")}).`);
    process.exit(1);
  }

  const client = postgres(connectionString, { max: 1, prepare: false });
  const db = drizzle(client);

  const schoolRows = await db.select().from(schools).orderBy(asc(schools.createdAt));

  const [{ n: globalCount }] = await db.select({ n: count() }).from(globalSchools);
  const [{ n: platformCount }] = await db.select({ n: count() }).from(platformUsers);

  console.log("── Tenant schools (schools table) ──");
  if (schoolRows.length === 0) {
    console.log("(none)");
  } else {
    console.table(
      schoolRows.map((r) => ({
        id: r.id,
        udise_code: r.udiseCode,
        name: r.name,
        district: r.district,
        board: r.board,
        subscription_status: r.subscriptionStatus,
      })),
    );
  }

  console.log("");
  console.log(`global_schools rows (directory): ${globalCount}`);
  console.log(`platform_users rows: ${platformCount}`);
  console.log("");

  await client.end({ timeout: 5 });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
