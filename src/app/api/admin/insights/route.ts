import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { fetchInsightsGeo, fetchRevenueSeries, type GeoScope, type RevenueGranularity } from "@/src/lib/insights-data";
import { isFounderSuperAdmin } from "@/src/lib/rbac";

export const dynamic = "force-dynamic";

const SCOPES = new Set<GeoScope>(["national", "state", "district"]);
const REV = new Set<RevenueGranularity>(["day", "week", "month", "year"]);

export async function GET(request: Request) {
  const session = await auth();
  if (!isFounderSuperAdmin(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const scopeRaw = searchParams.get("scope") ?? "national";
  const scope = SCOPES.has(scopeRaw as GeoScope) ? (scopeRaw as GeoScope) : "national";
  const state = searchParams.get("state") ?? undefined;
  const district = searchParams.get("district") ?? undefined;
  const revRaw = searchParams.get("revenue") ?? "month";
  const revenue = REV.has(revRaw as RevenueGranularity) ? (revRaw as RevenueGranularity) : "month";

  try {
    const [geo, revenueSeries] = await Promise.all([
      fetchInsightsGeo({ scope, state, district }),
      fetchRevenueSeries(revenue),
    ]);
    return NextResponse.json({ geo, revenueSeries }, { status: 200 });
  } catch (e) {
    console.error("insights:get", e);
    return NextResponse.json({ error: "Unable to load insights" }, { status: 500 });
  }
}
