#!/usr/bin/env node
/**
 * Lightweight project scan for CI / local sanity (no DB required).
 * Prints repo identity + reminds operators of launch-critical scripts.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));

console.log(`Project: ${pkg.name}@${pkg.version}`);
console.log("");
console.log("Launch-critical commands:");
console.log("  npm run verify:ci     lint + TypeScript");
console.log("  npm run build         production compile");
console.log("  npm run db:migrate    apply Drizzle migrations");
console.log("  npm run import:schools -- ...   load UDISE CSV → global_schools");
console.log("  npm run db:snapshot   tenant + directory row counts");
console.log("");
console.log("Health API (when server is running): GET /api/health");
console.log("  → includes checks.directory.globalSchoolsCount when DB is up.");
console.log("");
console.log("Security: src/middleware.ts adds baseline headers on every matched route.");
