import type { Session } from "next-auth";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { isJwtSuperAdmin, normalizeJwtRole } from "@/src/lib/middleware-route-roles";
import { resolveSessionTenantIds } from "@/src/lib/session-tenant";
export function canAccessTeacherConsole(session: Session | null): boolean {
  const r = normalizeJwtRole(session?.user?.role);
  return r === "teacher" || isJwtSuperAdmin(r);
}
export function requireTeacherSchoolId(session: Session | null): string {
  const { schoolId } = resolveSessionTenantIds(session);
  if (!schoolId) redirect("/school/dashboard");
  return schoolId;
}
export async function requireTeacherSession(): Promise<{ session: Session; tenantId: string }> {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=%2Fteacher%2Fdashboard");
  if (!canAccessTeacherConsole(session)) redirect("/school/dashboard");
  return { session, tenantId: requireTeacherSchoolId(session) };
}
