import type { Session } from "next-auth";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { primaryDashboardPathForPlatformRole } from "@/src/lib/post-login-redirect";
import { resolveSchoolUnlockedFromSession } from "@/src/lib/subscription";
import { resolveEffectiveSchoolId } from "@/src/lib/session-tenant";

/** Roles allowed into `/management` — matches root `middleware.ts` + `canAccessManagementPath`. */
export function canAccessManagementConsole(session: Session | null): boolean {
  const role = (typeof session?.user?.role === "string" ? session.user.role : "").trim().toLowerCase();
  return role === "management" || role === "super_admin";
}

export async function isPaidInstitution(session: Session | null): Promise<boolean> {
  return resolveSchoolUnlockedFromSession(session);
}

export async function requireManagementSession(): Promise<{
  session: Session;
  tenantId: string;
  paid: boolean;
  role: string;
}> {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=%2Fmanagement");
  }
  if (!canAccessManagementConsole(session)) {
    redirect(primaryDashboardPathForPlatformRole(session.user.role));
  }

  const tenantId = await resolveEffectiveSchoolId(session);
  if (!tenantId) {
    redirect(primaryDashboardPathForPlatformRole(session.user.role));
  }

  const paid = await isPaidInstitution(session);
  const role = typeof session.user.role === "string" ? session.user.role : "";
  return { session, tenantId, paid, role };
}
