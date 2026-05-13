import type { Session } from "next-auth";
import { asc } from "drizzle-orm";
import { cookies } from "next/headers";

import { schools } from "@/src/db/schema";
import { db } from "@/src/lib/db";
import { isMasterAdminSession } from "@/src/lib/master-admin";
import { getImpersonatedTenantId } from "@/src/lib/rbac";

/**
 * Resolves tenant IDs from the session. Handles NextAuth edge cases where
 * `platformUserId` may be missing but `user.id` / JWT `sub` still identifies the platform user.
 */
export function resolveSessionTenantIds(session: Session | null): {
  schoolId: string | undefined;
  platformUserId: string | undefined;
} {
  const u = session?.user;
  if (!u) {
    return { schoolId: undefined, platformUserId: undefined };
  }

  const schoolId = typeof u.schoolId === "string" ? u.schoolId : undefined;
  const explicitPlatform = typeof u.platformUserId === "string" ? u.platformUserId : undefined;
  const platformUserId =
    explicitPlatform ??
    (u.authSubject === "platform_user" && typeof u.id === "string" ? u.id : undefined);

  return { schoolId, platformUserId };
}

/**
 * Resolve the effective school ID for the session.
 * Priority: session schoolId → impersonation cookie (SUPER_ADMIN) → first DB school (SUPER_ADMIN).
 * Returns `undefined` only when no school can be resolved.
 */
export async function resolveEffectiveSchoolId(session: Session | null): Promise<string | undefined> {
  const { schoolId } = resolveSessionTenantIds(session);
  if (schoolId) return schoolId;

  if (isMasterAdminSession(session)) {
    const impersonated = getImpersonatedTenantId(await cookies());
    if (impersonated) return impersonated;

    const [first] = await db
      .select({ id: schools.id })
      .from(schools)
      .orderBy(asc(schools.createdAt))
      .limit(1);
    return first?.id;
  }

  return undefined;
}
