/**
 * Ensures every universal module has a full challenge bank (4 items).
 * Run: npx tsx scripts/verify-module-banks.ts
 */
import { allModules } from "../src/lib/modules";
import { MODULE_CHALLENGE_BANKS } from "../src/lib/module-challenge-banks";

const CUSTOM = new Set([
  "ai-study-planner",
  "homework-helper",
  "vedic-maths",
  "ai-quiz-generator",
  "ai-notes-generator",
]);

const catalogSlugs = new Set(allModules.map((m) => m.slug));
const universal = allModules.filter((m) => !CUSTOM.has(m.slug));

const missing: string[] = [];
const wrongCount: string[] = [];

for (const m of universal) {
  const bank = MODULE_CHALLENGE_BANKS[m.slug];
  if (!bank?.length) {
    missing.push(m.slug);
    continue;
  }
  if (bank.length !== 4) {
    wrongCount.push(`${m.slug}(${bank.length})`);
  }
}

const orphans = Object.keys(MODULE_CHALLENGE_BANKS).filter((k) => !catalogSlugs.has(k));

console.log("Universal modules:", universal.length);
console.log("Missing banks:", missing.length ? missing.join(", ") : "(none)");
console.log("Wrong counts:", wrongCount.length ? wrongCount.join(", ") : "(none)");
console.log("Orphan keys:", orphans.length ? orphans.join(", ") : "(none)");

if (missing.length || wrongCount.length || orphans.length) {
  process.exit(1);
}
console.log("verify-module-banks: OK");
process.exit(0);
