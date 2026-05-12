/**
 * Dev-only session override keys (see `auth.ts` jwt callback).
 * Never enable outside `NODE_ENV === "development"`.
 */
export type DevSessionUpdate = {
  clearDevSessionOverrides?: boolean;
  devRoleOverride?: string;
  devSchoolIdOverride?: string;
  /** Set linked student id for STUDENT role tests; pass empty string to clear override. */
  devLinkedStudentIdOverride?: string | null;
};

export const DEV_SWITCHABLE_ROLES = [
  "SUPER_ADMIN",
  "MANAGEMENT",
  "PRINCIPAL",
  "SCHOOL_ADMIN",
  "TEACHER",
  "PARENT",
  "STUDENT",
] as const;
