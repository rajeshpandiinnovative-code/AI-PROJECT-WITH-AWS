import type { Session } from "next-auth";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { canAccessSchoolAdminPath, normalizeJwtRole } from "@/src/lib/middleware-route-roles";
import { primaryDashboardPathForPlatformRole } from "@/src/lib/post-login-redirect";
import { resolveEffectiveSchoolId } from "@/src/lib/session-tenant";

/**
 * Who may load `/school-admin` (must match root `middleware.ts` and JWT role casing).
 * DB uses `SCHOOL_ADMIN`; JWT may normalize to `school_admin`. `MANAGEMENT` and `SUPER_ADMIN` (founder) are also allowed.
 */
export function isSchoolAdminRole(role: string | undefined | null): boolean {
  return canAccessSchoolAdminPath(normalizeJwtRole(role));
}

export async function requireSchoolAdminSession(): Promise<{ session: Session; tenantId: string }> {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=%2Fschool-admin");
  }
  if (!isSchoolAdminRole(session.user.role)) {
    redirect(primaryDashboardPathForPlatformRole(session.user.role));
  }
  const schoolId = await resolveEffectiveSchoolId(session);
  if (!schoolId) {
    redirect(primaryDashboardPathForPlatformRole(session.user.role));
  }
  return { session, tenantId: schoolId };
}
