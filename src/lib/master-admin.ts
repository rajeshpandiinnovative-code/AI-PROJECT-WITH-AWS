import type { Session } from "next-auth";

import { cleanEnv } from "@/src/lib/env";

/**
 * Master operator (you): full product control.
 *
 * True when either:
 * - `platform_users.role` is **`master_admin`**, or
 * - Email is listed in **`MASTER_ADMIN_EMAILS`** (comma-separated in `.env.local`).
 */
export function isMasterAdminSession(session: Session | null): boolean {
  const role = typeof session?.user?.role === "string" ? session.user.role.trim() : "";
  if (role === "master_admin") {
    return true;
  }
  const raw = cleanEnv(process.env.MASTER_ADMIN_EMAILS);
  if (!raw) {
    return false;
  }
  const email = typeof session?.user?.email === "string" ? session.user.email.trim().toLowerCase() : "";
  if (!email) {
    return false;
  }
  const allow = new Set(
    raw
      .split(/[,;\s]+/)
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  );
  return allow.has(email);
}
