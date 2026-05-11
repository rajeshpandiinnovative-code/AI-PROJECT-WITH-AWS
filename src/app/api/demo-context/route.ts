import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";

import { insertDemoSession, insertDemoSessionEvent } from "@/src/lib/demo-session";

const bodySchema = z.object({
  board: z.string().min(1).max(128),
  role: z.string().min(1).max(32),
  state: z.string().min(1).max(128),
  district: z.string().min(1).max(128),
  city: z.string().min(1).max(128),
  /** Present when using landing “Demo login” flow. */
  displayName: z.string().min(1).max(128).optional(),
  mobile: z.string().min(10).max(32).optional(),
});

const DEMO_COOKIE_MAX_AGE_SEC = 60 * 60 * 24;

function clientIp(request: Request): string | null {
  const h = request.headers;
  const xff = h.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    return first && first.length > 0 ? first.slice(0, 45) : null;
  }
  const real = h.get("x-real-ip");
  return real && real.length > 0 ? real.trim().slice(0, 45) : null;
}

/** Persists demo login context — cookie `aap_demo` + DB row (1-day access, auditable). */
export async function POST(request: Request) {
  try {
    const json: unknown = await request.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const sessionId = randomUUID();
    const expiresAt = new Date(Date.now() + DEMO_COOKIE_MAX_AGE_SEC * 1000);
    const ua = request.headers.get("user-agent");
    const ip = clientIp(request);
    const displayName = (parsed.data.displayName ?? "Demo user").trim().slice(0, 255);
    const mobile = (parsed.data.mobile ?? "0000000000").trim().slice(0, 32);

    await insertDemoSession({
      id: sessionId,
      displayName,
      mobile,
      board: parsed.data.board,
      role: parsed.data.role,
      state: parsed.data.state,
      district: parsed.data.district,
      city: parsed.data.city,
      expiresAt,
      userAgent: ua,
      ip,
    });
    await insertDemoSessionEvent(sessionId, "demo_login", {
      board: parsed.data.board,
      role: parsed.data.role,
      state: parsed.data.state,
    });

    const cookiePayload = {
      ...parsed.data,
      displayName,
      mobile,
      sessionId,
      expiresAt: expiresAt.toISOString(),
    };

    const res = NextResponse.json({ ok: true, sessionId, expiresAt: cookiePayload.expiresAt }, { status: 200 });
    res.cookies.set("aap_demo", JSON.stringify(cookiePayload), {
      path: "/",
      maxAge: DEMO_COOKIE_MAX_AGE_SEC,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
    return res;
  } catch (e) {
    console.error("demo-context:error", e);
    return NextResponse.json({ error: "Unable to save demo context" }, { status: 500 });
  }
}
