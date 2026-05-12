/**
 * Default landing route after auth. `SUPER_ADMIN` in JWT → `/admin/dashboard` (founder / global admin tier).
 * Keep aligned with `middleware.ts` for `pathname === "/dashboard"`.
 */
export function primaryDashboardPathForPlatformRole(role: string | undefined | null): string {
  const r = (role ?? "").trim().toLowerCase();
  if (r === "super_admin") return "/admin/dashboard";
  if (r === "parent") return "/parent/dashboard";
  if (r === "student") return "/student";
  if (r === "management") return "/management/dashboard";
  if (r === "teacher") return "/teacher/dashboard";
  return "/school/dashboard";
}
