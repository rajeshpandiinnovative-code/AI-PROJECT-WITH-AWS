import { asc, ilike, or } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/src/db/client";
import { globalSchools } from "@/src/db/schema";

/**
 * Search the national school directory (global_schools). Used by /onboarding “Claim your school”.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const raw = url.searchParams.get("q")?.trim() ?? "";
  if (raw.length < 2) {
    return NextResponse.json({ schools: [] });
  }

  const q = raw.slice(0, 120).replace(/[%_\\]/g, "");
  if (q.length < 2) {
    return NextResponse.json({ schools: [] });
  }

  const pattern = `%${q}%`;

  const matchesSearch = or(
    ilike(globalSchools.schoolName, pattern),
    ilike(globalSchools.udiseCode, pattern),
    ilike(globalSchools.blockName, pattern),
    ilike(globalSchools.districtName, pattern),
  );

  const rows = await db
    .select({
      udiseCode: globalSchools.udiseCode,
      schoolName: globalSchools.schoolName,
      districtName: globalSchools.districtName,
      blockName: globalSchools.blockName,
      boardName: globalSchools.boardName,
      pincode: globalSchools.pincode,
    })
    .from(globalSchools)
    .where(matchesSearch)
    .orderBy(asc(globalSchools.schoolName))
    .limit(25);

  return NextResponse.json({ schools: rows });
}
