import { and, eq, sql } from "drizzle-orm";

import { db } from "@/src/lib/db";
import { demoSessions, platformUsers, revenueEvents, schools } from "@/src/db/schema";
import { INDIAN_STATES, inferStateFromDistrict } from "@/src/lib/india-demo-locations";

export type GeoScope = "national" | "state" | "district";
export type RevenueGranularity = "day" | "week" | "month" | "year";

const PAYING_USER = sql`(
  (${platformUsers.subscriptionStatus} IN ('active', 'trialing') AND (
    ${platformUsers.subscriptionCurrentPeriodEnd} IS NULL OR ${platformUsers.subscriptionCurrentPeriodEnd} > NOW()
  ))
  OR (
    ${platformUsers.subscriptionStatus} = 'trial' AND ${platformUsers.subscriptionTrialEndsAt} IS NOT NULL
    AND ${platformUsers.subscriptionTrialEndsAt} > NOW()
  )
)`;

const PAYING_SCHOOL = sql`(
  (${schools.subscriptionStatus} IN ('active', 'trialing') AND (
    ${schools.subscriptionCurrentPeriodEnd} IS NULL OR ${schools.subscriptionCurrentPeriodEnd} > NOW()
  ))
  OR (
    ${schools.subscriptionStatus} = 'trial' AND ${schools.subscriptionTrialEndsAt} IS NOT NULL
    AND ${schools.subscriptionTrialEndsAt} > NOW()
  )
)`;

export type GeoRow = { label: string; demo: number; paid: number };

function mergeRows(demoMap: Map<string, number>, paidMap: Map<string, number>): GeoRow[] {
  const keys = new Set([...demoMap.keys(), ...paidMap.keys()]);
  return [...keys]
    .sort((a, b) => a.localeCompare(b))
    .map((label) => ({
      label,
      demo: demoMap.get(label) ?? 0,
      paid: paidMap.get(label) ?? 0,
    }));
}

async function demoCountsByState(): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  try {
    const rows = await db
      .select({
        label: demoSessions.state,
        n: sql<number>`count(*)::int`,
      })
      .from(demoSessions)
      .groupBy(demoSessions.state);
    for (const r of rows) {
      if (r.label) map.set(r.label, Number(r.n));
    }
  } catch {
    /* table missing */
  }
  return map;
}

async function demoCountsByDistrict(state: string): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  try {
    const rows = await db
      .select({
        label: demoSessions.district,
        n: sql<number>`count(*)::int`,
      })
      .from(demoSessions)
      .where(eq(demoSessions.state, state))
      .groupBy(demoSessions.district);
    for (const r of rows) {
      if (r.label) map.set(r.label, Number(r.n));
    }
  } catch {
    /* */
  }
  return map;
}

async function demoCountsByCity(state: string, district: string): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  try {
    const rows = await db
      .select({
        label: demoSessions.city,
        n: sql<number>`count(*)::int`,
      })
      .from(demoSessions)
      .where(and(eq(demoSessions.state, state), eq(demoSessions.district, district)))
      .groupBy(demoSessions.city);
    for (const r of rows) {
      if (r.label) map.set(r.label, Number(r.n));
    }
  } catch {
    /* */
  }
  return map;
}

async function payingPlatformUsersWithDistricts(): Promise<{ district: string | null }[]> {
  return db
    .select({ district: schools.district })
    .from(platformUsers)
    .innerJoin(schools, eq(platformUsers.schoolId, schools.id))
    .where(PAYING_USER);
}

async function payingSchoolsDistricts(): Promise<{ district: string }[]> {
  return db
    .select({ district: schools.district })
    .from(schools)
    .where(PAYING_SCHOOL);
}

function aggregatePaidByState(rows: { district: string | null }[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const r of rows) {
    const d = r.district?.trim() || "";
    const state = inferStateFromDistrict(d) ?? "Other / unmapped";
    map.set(state, (map.get(state) ?? 0) + 1);
  }
  return map;
}

function aggregatePaidByDistrict(rows: { district: string | null }[], state: string): Map<string, number> {
  const map = new Map<string, number>();
  for (const r of rows) {
    const d = r.district?.trim() || "";
    const inferred = inferStateFromDistrict(d);
    if (inferred !== state) continue;
    const label = d || "Unknown";
    map.set(label, (map.get(label) ?? 0) + 1);
  }
  return map;
}

export async function fetchInsightsGeo(params: {
  scope: GeoScope;
  state?: string | null;
  district?: string | null;
}): Promise<{
  rows: GeoRow[];
  totals: { demoSessions: number; payingPlatformUsers: number; payingSchools: number };
  hint?: string;
}> {
  const stateFilter = params.state?.trim() || "";
  const districtFilter = params.district?.trim() || "";

  let demoMap = new Map<string, number>();
  let paidMap = new Map<string, number>();
  let hint: string | undefined;

  if (params.scope === "national") {
    demoMap = await demoCountsByState();
    const [pu, sc] = await Promise.all([payingPlatformUsersWithDistricts(), payingSchoolsDistricts()]);
    paidMap = aggregatePaidByState([...pu, ...sc.map((s) => ({ district: s.district }))]);
    hint =
      "Paid counts use school district → state mapping (best-effort). Add clearer geography on schools later if needed.";
  } else if (params.scope === "state") {
    if (!stateFilter || !(INDIAN_STATES as readonly string[]).includes(stateFilter)) {
      return {
        rows: [],
        totals: { demoSessions: 0, payingPlatformUsers: 0, payingSchools: 0 },
        hint: "Pick a valid state/UT.",
      };
    }
    demoMap = await demoCountsByDistrict(stateFilter);
    const [pu, sc] = await Promise.all([payingPlatformUsersWithDistricts(), payingSchoolsDistricts()]);
    paidMap = aggregatePaidByDistrict([...pu, ...sc.map((s) => ({ district: s.district }))], stateFilter);
  } else {
    if (!stateFilter || !districtFilter) {
      return {
        rows: [],
        totals: { demoSessions: 0, payingPlatformUsers: 0, payingSchools: 0 },
        hint: "Select state and district.",
      };
    }
    demoMap = await demoCountsByCity(stateFilter, districtFilter);
    hint = "Paid breakdown at city level is not stored; chart shows demo sessions by city only.";
  }

  const rows = mergeRows(demoMap, paidMap);

  let demoSessionsTotal = 0;
  let payingUsers = 0;
  let payingSchoolsCount = 0;
  try {
    const [dCount] = await db.select({ n: sql<number>`count(*)::int` }).from(demoSessions);
    demoSessionsTotal = Number(dCount?.n ?? 0);
    payingUsers = (await db.select({ id: platformUsers.id }).from(platformUsers).where(PAYING_USER)).length;
    payingSchoolsCount = (await db.select({ id: schools.id }).from(schools).where(PAYING_SCHOOL)).length;
  } catch {
    for (const r of rows) {
      demoSessionsTotal += r.demo;
    }
  }

  return {
    rows,
    totals: {
      demoSessions: demoSessionsTotal,
      payingPlatformUsers: payingUsers,
      payingSchools: payingSchoolsCount,
    },
    hint,
  };
}

export async function fetchRevenueSeries(granularity: RevenueGranularity): Promise<
  { label: string; amountMinor: number }[]
> {
  const trunc =
    granularity === "day"
      ? "day"
      : granularity === "week"
        ? "week"
        : granularity === "month"
          ? "month"
          : "year";
  const labelPattern =
    granularity === "year" ? "YYYY" : granularity === "month" ? "YYYY-MM" : "YYYY-MM-DD";

  try {
    const bucketExpr = sql`date_trunc(${sql.raw(`'${trunc}'`)}, ${revenueEvents.occurredAt})`;
    const rows = await db
      .select({
        label: sql<string>`to_char(${bucketExpr}, ${sql.raw(`'${labelPattern}'`)})`,
        amountMinor: sql<number>`coalesce(sum(${revenueEvents.amountMinor}), 0)::bigint`,
      })
      .from(revenueEvents)
      .groupBy(bucketExpr)
      .orderBy(bucketExpr);

    return rows.map((r) => ({ label: r.label, amountMinor: Number(r.amountMinor) }));
  } catch {
    return [];
  }
}
