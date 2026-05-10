import { and, asc, eq, isNotNull, ne } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/src/db/client";
import { globalSchools } from "@/src/db/schema";

export const dynamic = "force-dynamic";

/**
 * Distinct facet values for cascading dropdowns on /onboarding (national directory).
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const kind = url.searchParams.get("kind") ?? "states";
  const state = url.searchParams.get("state")?.trim() ?? "";
  const district = url.searchParams.get("district")?.trim() ?? "";
  const block = url.searchParams.get("block")?.trim() ?? "";

  try {
    if (kind === "states") {
      const rows = await db
        .select({ v: globalSchools.stateName })
        .from(globalSchools)
        .where(and(isNotNull(globalSchools.stateName), ne(globalSchools.stateName, "")))
        .groupBy(globalSchools.stateName)
        .orderBy(asc(globalSchools.stateName));
      return NextResponse.json({ values: rows.map((r) => r.v!) });
    }

    if (kind === "districts") {
      if (!state) {
        return NextResponse.json({ values: [] });
      }
      const rows = await db
        .select({ v: globalSchools.districtName })
        .from(globalSchools)
        .where(
          and(
            eq(globalSchools.stateName, state),
            isNotNull(globalSchools.districtName),
            ne(globalSchools.districtName, ""),
          ),
        )
        .groupBy(globalSchools.districtName)
        .orderBy(asc(globalSchools.districtName));
      return NextResponse.json({ values: rows.map((r) => r.v!) });
    }

    if (kind === "blocks") {
      if (!state || !district) {
        return NextResponse.json({ values: [] });
      }
      const rows = await db
        .select({ v: globalSchools.blockName })
        .from(globalSchools)
        .where(
          and(
            eq(globalSchools.stateName, state),
            eq(globalSchools.districtName, district),
            isNotNull(globalSchools.blockName),
            ne(globalSchools.blockName, ""),
          ),
        )
        .groupBy(globalSchools.blockName)
        .orderBy(asc(globalSchools.blockName));
      return NextResponse.json({ values: rows.map((r) => r.v!) });
    }

    if (kind === "boards") {
      const cond = [
        isNotNull(globalSchools.boardName),
        ne(globalSchools.boardName, ""),
        ...(state ? [eq(globalSchools.stateName, state)] : []),
        ...(district ? [eq(globalSchools.districtName, district)] : []),
        ...(block ? [eq(globalSchools.blockName, block)] : []),
      ];
      const rows = await db
        .select({ v: globalSchools.boardName })
        .from(globalSchools)
        .where(and(...cond))
        .groupBy(globalSchools.boardName)
        .orderBy(asc(globalSchools.boardName));
      return NextResponse.json({ values: rows.map((r) => r.v!) });
    }

    return NextResponse.json({ error: "Unknown kind" }, { status: 400 });
  } catch (e) {
    console.error("directory/facets", e);
    return NextResponse.json({ error: "Facets lookup failed." }, { status: 500 });
  }
}
