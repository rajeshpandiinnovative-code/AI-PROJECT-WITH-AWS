import type { Session } from "next-auth";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { resolveSessionTenantIds } from "@/src/lib/session-tenant";

/**
 * Product constant: DB stores school staff as `admin`. `SCHOOL_ADMIN` reserved for future JWT normalization.
 */
export function isSchoolAdminRole(role: string | undefined | null): boolean {
  const r = (role ?? "").trim();
  return r === "admin" || r === "SCHOOL_ADMIN";
}

export function requireSchoolAdminTenantId(session: Session | null): string {
  const { schoolId } = resolveSessionTenantIds(session);
  if (!schoolId) {
    redirect("/school/dashboard");
  }
  return schoolId;
}

export async function requireSchoolAdminSession(): Promise<{ session: Session; tenantId: string }> {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=%2Fschool-admin");
  }
  if (!isSchoolAdminRole(session.user.role)) {
    redirect("/school/dashboard");
  }
  const tenantId = requireSchoolAdminTenantId(session);
  return { session, tenantId };
}
