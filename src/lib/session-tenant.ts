import type { Session } from "next-auth";

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
