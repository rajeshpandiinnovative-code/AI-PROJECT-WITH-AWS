import { and, asc, eq, ilike, or } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/src/db/client";
import { globalSchools } from "@/src/db/schema";

export const dynamic = "force-dynamic";

const MAX_LIMIT = 500;
const DEFAULT_LIMIT = 200;

/**
 * National directory: optional text `q` and/or exact facet filters (state, district, block, board).
 * Onboarding uses dropdowns + optional refine text; `q` alone still works (legacy).
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const rawQ = url.searchParams.get("q")?.trim() ?? "";
  const state = url.searchParams.get("state")?.trim() ?? "";
  const district = url.searchParams.get("district")?.trim() ?? "";
  const block = url.searchParams.get("block")?.trim() ?? "";
  const board = url.searchParams.get("board")?.trim() ?? "";

  const q = rawQ.slice(0, 120).replace(/[%_\\]/g, "");
  const qOk = q.length >= 2;

  const hasFilters = Boolean(state || district || block || board);

  if (!hasFilters && !qOk) {
    return NextResponse.json({ schools: [] });
  }

  const limitParam = Number(url.searchParams.get("limit") ?? DEFAULT_LIMIT);
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, Number.isFinite(limitParam) ? limitParam : DEFAULT_LIMIT),
  );

  const filterParts: SQL[] = [];
  if (state) {
    filterParts.push(eq(globalSchools.stateName, state));
  }
  if (district) {
    filterParts.push(eq(globalSchools.districtName, district));
  }
  if (block) {
    filterParts.push(eq(globalSchools.blockName, block));
  }
  if (board) {
    filterParts.push(eq(globalSchools.boardName, board));
  }

  let whereExpr: SQL | undefined =
    filterParts.length === 0 ? undefined : filterParts.length === 1 ? filterParts[0]! : and(...filterParts);

  if (qOk) {
    const pattern = `%${q}%`;
    const searchExpr = or(
      ilike(globalSchools.schoolName, pattern),
      ilike(globalSchools.udiseCode, pattern),
      ilike(globalSchools.blockName, pattern),
      ilike(globalSchools.districtName, pattern),
    );
    whereExpr = whereExpr ? and(whereExpr, searchExpr) : searchExpr;
  }

  if (!whereExpr) {
    return NextResponse.json({ schools: [] });
  }

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
    .where(whereExpr)
    .orderBy(asc(globalSchools.schoolName))
    .limit(limit);

  return NextResponse.json({ schools: rows });
}
