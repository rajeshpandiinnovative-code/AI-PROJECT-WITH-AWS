/**
 * JWT `role` strings on edge-protected paths (see `normalizeJwtRole`).
 * Canonical DB values are uppercase enum labels on `platform_users.role`; JWT may carry either casing.
 * Keep in sync with `requireManagementSession` / `requireSchoolAdminSession`.
 */

export function normalizeJwtRole(role: unknown): string {
  return typeof role === "string" ? role.trim().toLowerCase() : "";
}

/** `/management` — `MANAGEMENT`, plus product founder (`SUPER_ADMIN`). */
export function canAccessManagementPath(normalizedRole: string): boolean {
  return normalizedRole === "management" || normalizedRole === "super_admin";
}

/**
 * `/school-admin` — `SCHOOL_ADMIN`, `MANAGEMENT`, `PRINCIPAL`, or founder (`SUPER_ADMIN`).
 * Accepts legacy `admin` JWT while rows are backfilled to `SCHOOL_ADMIN`.
 */
export function canAccessSchoolAdminPath(normalizedRole: string): boolean {
  return (
    normalizedRole === "school_admin" ||
    normalizedRole === "admin" ||
    normalizedRole === "management" ||
    normalizedRole === "principal" ||
    normalizedRole === "super_admin"
  );
}

export function isLearnerOrClassroomStaff(normalizedRole: string): boolean {
  return normalizedRole === "teacher" || normalizedRole === "student" || normalizedRole === "parent";
}
