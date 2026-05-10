/** Roles that can register independently and attach their own Stripe price. */
export const PLATFORM_ROLES = [
  "student",
  "parent",
  "teacher",
  "admin",
  "management",
  "school_org",
] as const;

export type PlatformRole = (typeof PLATFORM_ROLES)[number];

export const PLATFORM_ROLE_LABELS: Record<PlatformRole, string> = {
  student: "Student",
  parent: "Parent",
  teacher: "Teacher",
  admin: "School admin",
  management: "Management",
  school_org: "School / institution",
};
