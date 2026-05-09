/**
 * Import CSV into `global_schools`. Use an official UTF-8 export from https://udiseplus.gov.in
 * (signed-in download). This script does not log into UDISE+.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { parse } from "csv-parse/sync";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { globalSchools } from "../src/db/schema";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
dotenv.config({ path: path.join(REPO_ROOT, ".env.local") });
dotenv.config();

type FieldSnake =
  | "udise_code"
  | "school_name"
  | "school_email"
  | "mobile_number"
  | "principal_name"
  | "state_name"
  | "district_name"
  | "block_name"
  | "pincode"
  | "management"
  | "category";

function normHeader(h: string): string {
  let s = h.trim().replace(/^\uFEFF/, "").toLowerCase();
  s = s.replace(/_/g, " ").replace(/-/g, " ");
  s = s.replace(/^\s*\d+(?:\.\d+)*\s*\.?\s*/u, "");
  s = s.replace(/^\(\s*[a-z]\s*\)\s*/iu, "");
  s = s.replace(/:\s*$/u, "").trim();
  s = s.replace(/\s+/g, " ");
  return s;
}

const NORM_TO_SNAKE: Partial<Record<string, FieldSnake>> = {
  "udise code": "udise_code",
  "udise sch code": "udise_code",
  "udise+ code": "udise_code",
  "11 digit udise code": "udise_code",
  "school name": "school_name",
  "name of school": "school_name",
  "name of the school": "school_name",
  "school name (in capital letters)": "school_name",
  "school email": "school_email",
  "sch email": "school_email",
  "e mail id": "school_email",
  "e mail": "school_email",
  "email id": "school_email",
  email: "school_email",
  "mobile number": "mobile_number",
  "mobile no": "mobile_number",
  "mobile no.": "mobile_number",
  mobile: "mobile_number",
  "sch mobile": "mobile_number",
  "contact number": "mobile_number",
  phone: "mobile_number",
  "phone number": "mobile_number",
  "principal name": "principal_name",
  principal: "principal_name",
  "hos name": "principal_name",
  "name of hos": "principal_name",
  "head of school": "principal_name",
  "name of principal": "principal_name",
  "state name": "state_name",
  state: "state_name",
  "district name": "district_name",
  "name of the district": "district_name",
  district: "district_name",
  "block name": "block_name",
  blk: "block_name",
  block: "block_name",
  "name of the udise+ block": "block_name",
  "name of the udise block": "block_name",
  pincode: "pincode",
  "pin code": "pincode",
  pin: "pincode",
  management: "management",
  mgmt: "management",
  "sch mgmt name": "management",
  "school management": "management",
  "management name": "management",
  category: "category",
  cat: "category",
  "school type": "category",
  "sch type name": "category",
  "school category": "category",
};

function parseCli(argv: string[]): { csvPath: string; boardType: string } {
  let csvPath = "";
  let boardType = "MATRIC";
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--csv" && argv[i + 1]) {
      csvPath = argv[++i];
      continue;
    }
    if (a === "--board-type" && argv[i + 1]) {
      boardType = argv[++i];
      continue;
    }
  }
  return { csvPath, boardType };
}

function extractFields(row: Record<string, string>): Partial<Record<FieldSnake, string>> {
  const out: Partial<Record<FieldSnake, string>> = {};
  for (const [rawKey, val] of Object.entries(row)) {
    const snake = NORM_TO_SNAKE[normHeader(rawKey)];
    if (!snake) continue;
    const t = String(val ?? "").trim();
    if (t === "") continue;
    out[snake] = t;
  }
  return out;
}

function toInsert(
  partial: Partial<Record<FieldSnake, string>>,
  boardName: string,
): typeof globalSchools.$inferInsert | null {
  const udise = (partial.udise_code ?? "").replace(/\D/g, "");
  if (!/^\d{11}$/.test(udise)) return null;
  const name = (partial.school_name ?? "").trim() || "Unknown school";
  const pin = (partial.pincode ?? "").replace(/\D/g, "").slice(0, 6);
  const mob = (partial.mobile_number ?? "").replace(/\D/g, "").slice(0, 15);
  return {
    udiseCode: udise,
    schoolName: name,
    schoolEmail: partial.school_email?.trim() || undefined,
    mobileNumber: mob || undefined,
    principalName: partial.principal_name?.trim() || undefined,
    stateName: partial.state_name?.trim() || undefined,
    districtName: partial.district_name?.trim() || undefined,
    blockName: partial.block_name?.trim() || undefined,
    pincode: pin || undefined,
    management: partial.management?.trim() || undefined,
    category: partial.category?.trim() || undefined,
    boardName: boardName.trim() || undefined,
  };
}

async function main() {
  const { csvPath: csvArg, boardType } = parseCli(process.argv);
  const csvPath = csvArg
    ? path.resolve(process.cwd(), csvArg)
    : path.join(REPO_ROOT, "data", "schools", "srivilliputhur-block.csv");

  if (!fs.existsSync(csvPath)) {
    console.error(`CSV not found: ${csvPath}`);
    process.exit(1);
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL is missing (.env.local).");
    process.exit(1);
  }

  const raw = fs.readFileSync(csvPath, "utf8");
  const records = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true,
    relax_column_count: true,
    comment: "#",
  }) as Record<string, string>[];

  const inserts: (typeof globalSchools.$inferInsert)[] = [];
  let skipped = 0;
  for (const row of records) {
    const ins = toInsert(extractFields(row), boardType);
    if (ins) inserts.push(ins);
    else skipped++;
  }

  if (inserts.length === 0) {
    console.error("No valid rows (need 11-digit UDISE + mappable headers).");
    process.exit(1);
  }

  const sqlClient = postgres(connectionString, { max: 1, prepare: false });
  const db = drizzle(sqlClient);

  const batchSize = 400;
  for (let i = 0; i < inserts.length; i += batchSize) {
    const batch = inserts.slice(i, i + batchSize);
    await db
      .insert(globalSchools)
      .values(batch)
      .onConflictDoUpdate({
        target: globalSchools.udiseCode,
        set: {
          schoolName: sql`excluded.school_name`,
          schoolEmail: sql`excluded.school_email`,
          mobileNumber: sql`excluded.mobile_number`,
          principalName: sql`excluded.principal_name`,
          stateName: sql`excluded.state_name`,
          districtName: sql`excluded.district_name`,
          blockName: sql`excluded.block_name`,
          pincode: sql`excluded.pincode`,
          management: sql`excluded.management`,
          category: sql`excluded.category`,
          boardName: sql`excluded.board_name`,
        },
      });
  }

  await sqlClient.end({ timeout: 5 });
  console.log(
    `Imported ${inserts.length} schools into global_schools (board_name=${boardType}). Skipped ${skipped} rows.`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
