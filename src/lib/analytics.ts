import { count, desc, gte } from "drizzle-orm";

import { analyticsEvents, demoLeads } from "@/src/db/schema";
import { db } from "@/src/lib/db";

export function clientIp(request: Request): string | undefined {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) {
      return first.slice(0, 45);
    }
  }
  const real = request.headers.get("x-real-ip");
  if (real) {
    return real.slice(0, 45);
  }
  return undefined;
}

export async function recordAnalyticsEvent(opts: {
  eventType: string;
  payload?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
}): Promise<void> {
  try {
    await db.insert(analyticsEvents).values({
      eventType: opts.eventType,
      payload: opts.payload ?? {},
      ip: opts.ip ?? null,
      userAgent: opts.userAgent ?? null,
    });
  } catch (e) {
    console.error("analytics:record_failed", e);
  }
}

export async function recordDemoLead(opts: {
  name: string;
  mobile: string;
  referrer?: string;
  path?: string;
  ip?: string;
  userAgent?: string;
  /** State / UT for nationwide rollout segmentation (analytics only). */
  regionUt?: string;
}): Promise<void> {
  await db.insert(demoLeads).values({
    name: opts.name.trim(),
    mobile: opts.mobile.trim(),
    referrer: opts.referrer ?? null,
    path: opts.path ?? null,
  });
  await recordAnalyticsEvent({
    eventType: "demo_lead",
    payload: {
      name: opts.name.trim(),
      mobile: opts.mobile.trim(),
      path: opts.path,
      regionUt: opts.regionUt?.trim() || undefined,
    },
    ip: opts.ip,
    userAgent: opts.userAgent,
  });
}

export async function summarizeAnalytics(): Promise<{
  demoLeadsRecent: Array<{ id: string; name: string; mobile: string; path: string | null; createdAt: Date }>;
  eventsRecent: Array<{ id: string; eventType: string; payload: unknown; ip: string | null; createdAt: Date }>;
  eventCounts7d: Record<string, number>;
}> {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [demoRows, eventRows, counts] = await Promise.all([
    db
      .select({
        id: demoLeads.id,
        name: demoLeads.name,
        mobile: demoLeads.mobile,
        path: demoLeads.path,
        createdAt: demoLeads.createdAt,
      })
      .from(demoLeads)
      .orderBy(desc(demoLeads.createdAt))
      .limit(80),
    db
      .select({
        id: analyticsEvents.id,
        eventType: analyticsEvents.eventType,
        payload: analyticsEvents.payload,
        ip: analyticsEvents.ip,
        createdAt: analyticsEvents.createdAt,
      })
      .from(analyticsEvents)
      .orderBy(desc(analyticsEvents.createdAt))
      .limit(200),
    db
      .select({
        eventType: analyticsEvents.eventType,
        n: count(),
      })
      .from(analyticsEvents)
      .where(gte(analyticsEvents.createdAt, since))
      .groupBy(analyticsEvents.eventType),
  ]);

  const eventCounts7d: Record<string, number> = {};
  for (const row of counts) {
    eventCounts7d[row.eventType] = Number(row.n);
  }

  return {
    demoLeadsRecent: demoRows,
    eventsRecent: eventRows,
    eventCounts7d,
  };
}
