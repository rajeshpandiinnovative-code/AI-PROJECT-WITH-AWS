import type { Session } from "next-auth";
import type { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import { z } from "zod";

import { cleanEnv } from "@/src/lib/env";

export const APP_ROLES = ["SUPER_ADMIN", "PRINCIPAL", "TEACHER"] as const;
export type AppRole = (typeof APP_ROLES)[number];

/**
 * Founder-only global role restriction.
 * Set `FOUNDER_EMAIL` in `.env.local`; fallback keeps local dev workable.
 */
export function founderEmail(): string {
  const configured = cleanEnv(process.env.FOUNDER_EMAIL).toLowerCase();
  if (configured) return configured;
  return "rajeshpandi.innovative@gmail.com";
}

/**
 * Maps persisted / JWT `platform_users.role` (enum labels or legacy lowercase) to a coarse app role
 * used for middleware `/dashboard` routing and founder detection.
 *
 * - `SUPER_ADMIN` → product founder tier when combined with {@link founderEmail}.
 * - `MANAGEMENT`, `SCHOOL_ADMIN`, `PRINCIPAL`, and legacy lowercase `admin` → `PRINCIPAL` bucket for school-ops guards.
 * - `TEACHER` → classroom staff.
 */
export function mapRoleToAppRole(role: string | undefined | null): AppRole {
  const r = (role ?? "").trim().toLowerCase();
  if (r === "super_admin") return "SUPER_ADMIN";
  if (r === "teacher") return "TEACHER";
  return "PRINCIPAL";
}

export function sessionAppRole(session: Session | null): AppRole {
  return mapRoleToAppRole(session?.user?.role);
}

export function isFounderSuperAdmin(session: Session | null): boolean {
  const email = (session?.user?.email ?? "").trim().toLowerCase();
  if (!email) return false;
  return sessionAppRole(session) === "SUPER_ADMIN" && email === founderEmail();
}

export const IMPERSONATE_TENANT_COOKIE = "aap_impersonate_tenant";

export function getImpersonatedTenantId(cookies: ReadonlyRequestCookies): string | undefined {
  const raw = cookies.get(IMPERSONATE_TENANT_COOKIE)?.value?.trim();
  if (!raw) return undefined;
  const parsed = z.string().uuid().safeParse(raw);
  return parsed.success ? parsed.data : undefined;
}
