import type { Session } from "next-auth";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { isJwtSuperAdmin, normalizeJwtRole } from "@/src/lib/middleware-route-roles";
import { primaryDashboardPathForPlatformRole } from "@/src/lib/post-login-redirect";
import { resolveEffectiveSchoolId } from "@/src/lib/session-tenant";
export function canAccessTeacherConsole(session: Session | null): boolean {
  const r = normalizeJwtRole(session?.user?.role);
  return r === "teacher" || isJwtSuperAdmin(r);
}
export async function requireTeacherSession(): Promise<{ session: Session; tenantId: string }> {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=%2Fteacher%2Fdashboard");
  if (!canAccessTeacherConsole(session)) redirect(primaryDashboardPathForPlatformRole(session.user.role));
  const schoolId = await resolveEffectiveSchoolId(session);
  if (!schoolId) redirect(primaryDashboardPathForPlatformRole(session.user.role));
  return { session, tenantId: schoolId };
}
