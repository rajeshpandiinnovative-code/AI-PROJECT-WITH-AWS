/**
 * Validates required env keys for local dev / pilot.
 * Loads .env.local only for this check (does not print secret values).
 */
const path = require("node:path");
const fs = require("node:fs");

const root = path.join(__dirname, "..");
const envLocal = path.join(root, ".env.local");

if (!fs.existsSync(envLocal)) {
  console.error(`Missing ${path.relative(root, envLocal)} — create it (see .env.example).`);
  process.exit(1);
}

require("dotenv").config({ path: envLocal });

const required = [
  "DATABASE_URL",
  "GEMINI_API_KEY",
  "GOOGLE_CLOUD_VISION_API_KEY",
  "MARKING_RUBRIC",
];

const authSecretOk = Boolean(
  (process.env.AUTH_SECRET && process.env.AUTH_SECRET.trim()) ||
    (process.env.NEXTAUTH_SECRET && process.env.NEXTAUTH_SECRET.trim()),
);

const missing = required.filter((key) => !process.env[key] || String(process.env[key]).trim() === "");

if (!authSecretOk) {
  missing.push("AUTH_SECRET or NEXTAUTH_SECRET");
}

if (missing.length) {
  console.error("Missing or empty environment variables:");
  for (const key of missing) {
    console.error(`  - ${key}`);
  }
  console.error("\nFix .env.local, then re-run: npm run check:env");
  process.exit(1);
}

console.log("Environment check passed (required keys are set).");
process.exit(0);
