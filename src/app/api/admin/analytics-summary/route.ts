import { NextResponse } from "next/server";

import { summarizeAnalytics } from "@/src/lib/analytics";
import { cleanEnv } from "@/src/lib/env";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = cleanEnv(process.env.ANALYTICS_ADMIN_SECRET);
  if (!secret) {
    return NextResponse.json({ error: "ANALYTICS_ADMIN_SECRET not configured" }, { status: 503 });
  }

  const auth = request.headers.get("authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (token !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const summary = await summarizeAnalytics();
    return NextResponse.json(summary, { status: 200 });
  } catch (e) {
    console.error("analytics-summary:error", e);
    return NextResponse.json({ error: "Unable to load summary" }, { status: 500 });
  }
}
