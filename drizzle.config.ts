import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Match scripts/run-migrate.mjs: `.env.local` wins, then `.env`.
config({ path: ".env.local", override: true });
config();

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is not set. Add it to .env.local (same as npm run db:migrate).",
  );
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: databaseUrl,
  },
});
