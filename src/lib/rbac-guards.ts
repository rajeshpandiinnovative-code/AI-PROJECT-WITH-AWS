import type { Session } from "next-auth";
import { NextResponse } from "next/server";

import { isFounderSuperAdmin, sessionAppRole, type AppRole } from "@/src/lib/rbac";

export function requireSession(session: Session | null): NextResponse | null {
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export function requireRole(session: Session | null, allowed: AppRole[]): NextResponse | null {
  const blocked = requireSession(session);
  if (blocked) return blocked;

  const role = sessionAppRole(session);
  if (!allowed.includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

/** Principal-only school operations; founder super-admin can always operate. */
export function requirePrincipalOrFounder(session: Session | null): NextResponse | null {
  const blocked = requireSession(session);
  if (blocked) return blocked;
  if (isFounderSuperAdmin(session) || sessionAppRole(session) === "PRINCIPAL") {
    return null;
  }
  return NextResponse.json({ error: "Forbidden: principal access required" }, { status: 403 });
}
