import { desc } from "drizzle-orm";
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { analyticsEvents } from "@/src/db/schema";
import { db } from "@/src/lib/db";
import { isFounderSuperAdmin } from "@/src/lib/rbac";

export async function GET() {
  const session = await auth();
  if (!isFounderSuperAdmin(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const logs = await db
    .select({
      id: analyticsEvents.id,
      eventType: analyticsEvents.eventType,
      createdAt: analyticsEvents.createdAt,
      payload: analyticsEvents.payload,
    })
    .from(analyticsEvents)
    .orderBy(desc(analyticsEvents.createdAt))
    .limit(15);

  const data = logs.map((row) => {
    const payload = row.payload as Record<string, unknown>;
    let details: string | undefined;
    if (row.eventType === "login_success") {
      const role = payload?.role;
      details =
        typeof role === "string" && role.length > 0 ? `User authenticated as ${role}` : "User authenticated";
    } else if (row.eventType === "admin_gemini_model_changed") {
      details =
        typeof payload?.model === "string" ? `Global text model → ${payload.model}` : "Global text model updated";
    }
    return {
      id: row.id,
      eventType: row.eventType,
      createdAt: row.createdAt.toISOString(),
      details,
    };
  });

  return NextResponse.json({ data }, { status: 200 });
}
