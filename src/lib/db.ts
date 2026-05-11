import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "@/src/db/schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const useSsl =
  process.env.DATABASE_SSL === "true" ||
  process.env.DATABASE_SSL === "1";

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
    ...(useSsl ? { ssl: true } : {}),
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__oasisSql = sql;
}

export const db = drizzle(sql, { schema });

/** Connectivity check using the same pool as Drizzle (avoids driver quirks with `db.execute`). */
export async function pingDatabase(): Promise<void> {
  await sql`select 1`;
}
