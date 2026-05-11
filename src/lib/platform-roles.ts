/**
 * Canonical platform roles (persisted on `platform_users.role`, demo cookie, billing, etc.).
 *
 * - **`school_org`** — Institution **founder / owner** (billing and school-level unlock). Not a classroom worker.
 * - **`admin`** — **School admin (staff)**: day-to-day operations in the product; not necessarily the billing owner.
 *
 * Permission matrices (who can unlock modules, invite users, etc.) are enforced in app code — wire per role later.
 */
export const PLATFORM_ROLES = [
  "student",
  "parent",
  "teacher",
  "admin",
  "management",
  "school_org",
  /** Product-wide operator — set only via admin/script, never self-service signup. */
  "master_admin",
] as const;

export type PlatformRole = (typeof PLATFORM_ROLES)[number];

/** Roles shown on `/register` and demo login (excludes `master_admin`). */
export const SELECTABLE_PLATFORM_ROLES = PLATFORM_ROLES.filter((r) => r !== "master_admin");

/** Short labels for selects, dashboards, and pricing UI. */
export const PLATFORM_ROLE_LABELS: Record<PlatformRole, string> = {
  student: "Student",
  parent: "Parent",
  teacher: "Teacher",
  admin: "School admin (staff)",
  management: "Management",
  school_org: "Founder / institution",
  master_admin: "Super Admin",
};
