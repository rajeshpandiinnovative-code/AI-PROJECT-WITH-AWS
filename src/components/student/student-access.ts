import type { Session } from "next-auth";
import { and, asc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { students } from "@/src/db/schema";
import { db } from "@/src/lib/db";
import { isJwtSuperAdmin, normalizeJwtRole } from "@/src/lib/middleware-route-roles";
import { primaryDashboardPathForPlatformRole } from "@/src/lib/post-login-redirect";
import { resolveEffectiveSchoolId } from "@/src/lib/session-tenant";

export function canAccessStudentPortal(session: Session | null): boolean {
  const r = normalizeJwtRole(session?.user?.role);
  return r === "student" || isJwtSuperAdmin(r);
}

export async function requireStudentSession(): Promise<{ session: Session; schoolId: string; studentId: string }> {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=%2Fstudent");
  }
  const roleDashboard = primaryDashboardPathForPlatformRole(session.user.role);

  if (!canAccessStudentPortal(session)) {
    redirect(roleDashboard);
  }
  const schoolId = await resolveEffectiveSchoolId(session);
  if (!schoolId) {
    redirect(roleDashboard);
  }

  const r = normalizeJwtRole(session.user.role);
  if (isJwtSuperAdmin(r)) {
    const [stu] = await db
      .select({ id: students.id })
      .from(students)
      .where(eq(students.schoolId, schoolId))
      .orderBy(asc(students.createdAt))
      .limit(1);
    return { session, schoolId, studentId: stu?.id ?? "" };
  }

  const linkedStudentId =
    typeof session.user.linkedStudentId === "string" ? session.user.linkedStudentId : undefined;
  if (!linkedStudentId) {
    redirect(roleDashboard);
  }

  const row = await db
    .select({ id: students.id })
    .from(students)
    .where(and(eq(students.id, linkedStudentId), eq(students.schoolId, schoolId)))
    .limit(1);

  if (!row.length) {
    redirect(roleDashboard);
  }

  return { session, schoolId, studentId: linkedStudentId };
}
