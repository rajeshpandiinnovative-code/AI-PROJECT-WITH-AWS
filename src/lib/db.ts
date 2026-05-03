import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "@/src/db/schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

declare global {
  var __oasisSql: ReturnType<typeof postgres> | undefined;
}

const sql =
  globalThis.__oasisSql ??
  postgres(connectionString, {
    max: 1,
    prepare: false,
    idle_timeout: 20,
    connect_timeout: 10,
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__oasisSql = sql;
}

export const db = drizzle(sql, { schema });
