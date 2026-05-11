import type { Session } from "next-auth";

import { type TenantContext } from "./tenant";

/** Thrown when DB queries run without a resolved tenant school. */
export const TENANT_CONTEXT_REQUIRED_MESSAGE = "Security Breach: Tenant Context Required";

/**
 * Mandatory tenant guard for all tenant-scoped queries.
 * Call at the top of every query that must never cross schools.
 */
export function requireStrictTenantSchoolId(schoolId: unknown): string {
  if (schoolId === null || schoolId === undefined) {
    throw new Error(TENANT_CONTEXT_REQUIRED_MESSAGE);
  }
  if (typeof schoolId !== "string") {
    throw new Error(TENANT_CONTEXT_REQUIRED_MESSAGE);
  }
  const trimmed = schoolId.trim();
  if (!trimmed) {
    throw new Error(TENANT_CONTEXT_REQUIRED_MESSAGE);
  }
  return trimmed;
}

export function createTenantContext(session: Session | null): TenantContext {
  const schoolId = requireStrictTenantSchoolId(session?.user?.schoolId ?? undefined);
  return { schoolId };
}
