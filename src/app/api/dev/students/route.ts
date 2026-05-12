import { asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

import { students } from "@/src/db/schema";
import { db } from "@/src/lib/db";

const querySchema = z.object({
  schoolId: z.string().uuid(),
});

/** Lists students in a school for DevSwitcher linked-student picker (development only). */
export async function GET(request: Request) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const url = new URL(request.url);
  const parsed = querySchema.safeParse({ schoolId: url.searchParams.get("schoolId") ?? "" });
  if (!parsed.success) {
    return NextResponse.json({ error: "schoolId (uuid) required" }, { status: 400 });
  }

  const rows = await db
    .select({ id: students.id, name: students.name, rollNo: students.rollNo })
    .from(students)
    .where(eq(students.schoolId, parsed.data.schoolId))
    .orderBy(asc(students.rollNo));

  return NextResponse.json({ students: rows });
}
