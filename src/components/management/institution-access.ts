import type { Session } from "next-auth";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { resolveSchoolUnlockedFromSession } from "@/src/lib/subscription";
import { resolveSessionTenantIds } from "@/src/lib/session-tenant";

/** Roles allowed into the institutional management console (product: Owner / Principal tier). */
const MANAGEMENT_CONSOLE_ROLES = new Set(["management", "school_org"]);

/**
 * Product “Correspondent” / institution billing owner aligns with `school_org` in this codebase.
 * `management` is the executive / principal-tier operator.
 */
export function canAccessManagementConsole(session: Session | null): boolean {
  const role = typeof session?.user?.role === "string" ? session.user.role : "";
  return MANAGEMENT_CONSOLE_ROLES.has(role);
}

/** Tenant scope for all queries — never read outside this school. */
export function requireManagementSchoolId(session: Session | null): string {
  const { schoolId } = resolveSessionTenantIds(session);
  if (!schoolId) {
    redirect("/school/dashboard");
  }
  return schoolId;
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
    redirect("/school/dashboard");
  }
  const tenantId = requireManagementSchoolId(session);
  const paid = await isPaidInstitution(session);
  const role = typeof session.user.role === "string" ? session.user.role : "";
  return { session, tenantId, paid, role };
}
