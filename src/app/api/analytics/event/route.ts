import { NextResponse } from "next/server";
import { z } from "zod";

import { clientIp, recordAnalyticsEvent } from "@/src/lib/analytics";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  eventType: z.string().min(1).max(64),
  payload: z.record(z.string(), z.any()).optional(),
  path: z.string().max(512).optional(),
  referrer: z.string().max(2048).optional(),
});

export async function POST(request: Request) {
  try {
    const json: unknown = await request.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const { eventType, payload, path, referrer } = parsed.data;
    const merged = {
      ...(payload ?? {}),
      ...(path ? { path } : {}),
      ...(referrer ? { referrer } : {}),
    };

    await recordAnalyticsEvent({
      eventType,
      payload: merged,
      ip: clientIp(request),
      userAgent: request.headers.get("user-agent") ?? undefined,
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Unable to record event" }, { status: 500 });
  }
}
