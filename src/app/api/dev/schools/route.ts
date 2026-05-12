import { asc } from "drizzle-orm";
import { NextResponse } from "next/server";

import { schools } from "@/src/db/schema";
import { db } from "@/src/lib/db";

/** Lists tenants for the DevSwitcher (development only). */
export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const rows = await db
    .select({ id: schools.id, name: schools.name })
    .from(schools)
    .orderBy(asc(schools.name));

  return NextResponse.json({ schools: rows });
}
