/**
 * Canonical roles persisted on `platform_users.role` (Drizzle `platform_user_role` enum).
 *
 * Additional members support Stripe checkout scopes and demo flows that are not stored on `platform_users`.
 */
export const PLATFORM_ROLES = [
  "SUPER_ADMIN",
  "MANAGEMENT",
  "PRINCIPAL",
  "SCHOOL_ADMIN",
  "TEACHER",
  "student",
  "parent",
  "school",
] as const;

export type PlatformRole = (typeof PLATFORM_ROLES)[number];

/** Roles shown on `/register/account` (self-service; excludes `SUPER_ADMIN`). */
export const SELECTABLE_PLATFORM_ROLES: readonly PlatformRole[] = [
  "TEACHER",
  "PRINCIPAL",
  "SCHOOL_ADMIN",
  "MANAGEMENT",
];

/** Demo login: includes learner roles not offered on paid self-service registration. */
export const DEMO_SELECTABLE_PLATFORM_ROLES: readonly PlatformRole[] = [
  "student",
  "parent",
  "TEACHER",
  "PRINCIPAL",
  "SCHOOL_ADMIN",
  "MANAGEMENT",
];

/** Short labels for selects, dashboards, and pricing UI. */
export const PLATFORM_ROLE_LABELS: Record<PlatformRole, string> = {
  SUPER_ADMIN: "Super Admin (founder)",
  MANAGEMENT: "Management",
  PRINCIPAL: "Principal",
  SCHOOL_ADMIN: "School admin",
  TEACHER: "Teacher",
  student: "Student",
  parent: "Parent",
  school: "School (tenant)",
};
