/**
 * Trigger daily intervention digest generation via token-protected API.
 *
 * Usage examples:
 *   node scripts/run-digest-cron.mjs
 *   node scripts/run-digest-cron.mjs --schoolId <uuid>
 *   node scripts/run-digest-cron.mjs --limit 200
 *   node scripts/run-digest-cron.mjs --baseUrl https://your-domain.com
 *   node scripts/run-digest-cron.mjs --help
 */
import { config } from "dotenv";

config({ path: ".env.local", override: true });

function readArg(flag) {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return "";
  return process.argv[idx + 1] ?? "";
}

function hasFlag(flag) {
  return process.argv.includes(flag);
}

function printHelp() {
  console.log(`run-digest-cron.mjs

Options:
  --schoolId <uuid>   Generate digest for one school only
  --limit <number>    Max number of schools in batch mode (default 200)
  --baseUrl <url>     Override API base URL
  --help              Show this message
`);
}

if (hasFlag("--help")) {
  printHelp();
  process.exit(0);
}

const token = (process.env.DIGEST_CRON_TOKEN ?? "").trim();
if (!token) {
  console.error("DIGEST_CRON_TOKEN is missing. Set it in .env.local or environment.");
  process.exit(1);
}

const explicitBaseUrl = readArg("--baseUrl").trim();
const baseUrl =
  explicitBaseUrl ||
  (process.env.APP_BASE_URL ?? "").trim() ||
  (process.env.NEXT_PUBLIC_APP_URL ?? "").trim() ||
  "http://localhost:3000";

const schoolId = readArg("--schoolId").trim();
const limitRaw = readArg("--limit").trim();
const limit = limitRaw ? Number(limitRaw) : 200;
if (!Number.isInteger(limit) || limit <= 0) {
  console.error("--limit must be a positive integer.");
  process.exit(1);
}

const payload = schoolId ? { schoolId } : { limit };

const endpoint = `${baseUrl.replace(/\/+$/, "")}/api/interventions/digest`;
console.log(`POST ${endpoint}`);
console.log(`Mode: ${schoolId ? `single school (${schoolId})` : `batch (limit ${limit})`}`);

try {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-cron-token": token,
    },
    body: JSON.stringify(payload),
  });

  const text = await response.text();
  if (!response.ok) {
    console.error(`Request failed (${response.status}): ${text}`);
    process.exit(1);
  }

  console.log(`Request succeeded (${response.status}).`);
  console.log(text);
} catch (error) {
  console.error("Digest cron request failed:", error);
  process.exit(1);
}
