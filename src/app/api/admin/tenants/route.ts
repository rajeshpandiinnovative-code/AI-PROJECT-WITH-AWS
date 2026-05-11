import { asc } from "drizzle-orm";
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { schools } from "@/src/db/schema";
import { db } from "@/src/lib/db";
import { isFounderSuperAdmin } from "@/src/lib/rbac";

export const dynamic = "force-dynamic";

/** Tenant management list — founder super-admin only. */
export async function GET() {
  const session = await auth();
  if (!isFounderSuperAdmin(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rows = await db
    .select({
      id: schools.id,
      name: schools.name,
      district: schools.district,
      board: schools.board,
      subscriptionStatus: schools.subscriptionStatus,
    })
    .from(schools)
    .orderBy(asc(schools.name))
    .limit(500);

  return NextResponse.json({ data: rows }, { status: 200 });
}
