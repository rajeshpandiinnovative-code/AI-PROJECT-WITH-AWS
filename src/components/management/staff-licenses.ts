import { cleanEnv } from "@/src/lib/env";

/** Roles that consume a “staff seat” for license metering (excludes students/parents). */
export const STAFF_LICENSE_ROLES = new Set(["teacher", "admin", "management", "school_org"]);

export function getStaffLicenseCap(): number {
  const raw = cleanEnv(process.env.MANAGEMENT_STAFF_LICENSE_CAP);
  if (!raw) return 10;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : 10;
}
