import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

config({ path: ".env.local" });

export default defineConfig({
  dialect: "postgresql", // Change to "mysql" or "sqlite" if needed
  schema: "./src/db/schema.ts", // Make sure this path to your schema is correct!
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
