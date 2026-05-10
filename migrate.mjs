#!/usr/bin/env node
/**
 * Run DB migrations from any working directory (repo root = this file’s directory).
 * Usage:
 *   node migrate.mjs
 *   node /mnt/c/Users/you/Desktop/ai-academy-pro/migrate.mjs
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = __dirname;
const runner = path.join(root, "scripts", "run-migrate.mjs");

const result = spawnSync(process.execPath, [runner], {
  cwd: root,
  stdio: "inherit",
  env: process.env,
});

process.exit(result.status ?? 1);
