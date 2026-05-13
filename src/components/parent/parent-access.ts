import type { Session } from "next-auth";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { isJwtSuperAdmin, normalizeJwtRole } from "@/src/lib/middleware-route-roles";
import { primaryDashboardPathForPlatformRole } from "@/src/lib/post-login-redirect";
import { resolveEffectiveSchoolId, resolveSessionTenantIds } from "@/src/lib/session-tenant";

export function canAccessParentPortal(session: Session | null): boolean {
  const r = normalizeJwtRole(session?.user?.role);
  return r === "parent" || isJwtSuperAdmin(r);
}

export async function requireParentSession(): Promise<{
  session: Session;
  schoolId: string;
  parentPlatformUserId: string;
}> {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=%2Fparent%2Fdashboard");
  }
  const roleDashboard = primaryDashboardPathForPlatformRole(session.user.role);

  if (!canAccessParentPortal(session)) {
    redirect(roleDashboard);
  }
  const schoolId = await resolveEffectiveSchoolId(session);
  const { platformUserId } = resolveSessionTenantIds(session);
  if (!schoolId || !platformUserId) {
    redirect(roleDashboard);
  }
  return { session, schoolId, parentPlatformUserId: platformUserId };
}
