import type { PlatformRole } from "@/src/lib/platform-roles";
import { cleanEnv } from "@/src/lib/env";
import { normalizeBoardKey } from "@/src/lib/board-billing";

function env(name: string): string {
  return cleanEnv(process.env[name]);
}

const ROLE_ENV: Record<PlatformRole, string> = {
  SUPER_ADMIN: "STRIPE_PRICE_MASTER_ADMIN",
  MANAGEMENT: "STRIPE_PRICE_MANAGEMENT",
  PRINCIPAL: "STRIPE_PRICE_MANAGEMENT",
  SCHOOL_ADMIN: "STRIPE_PRICE_ADMIN",
  TEACHER: "STRIPE_PRICE_TEACHER",
  student: "STRIPE_PRICE_STUDENT",
  parent: "STRIPE_PRICE_PARENT",
  school: "",
};

/**
 * Stripe Price IDs are resolved by **board** + product:
 *
 * - School tenant: `STRIPE_PRICE_SCHOOL_<BOARD_KEY>` (e.g. STRIPE_PRICE_SCHOOL_MATRIC)
 * - Individual role: `STRIPE_PRICE_<ROLE>_<BOARD_KEY>` (e.g. STRIPE_PRICE_TEACHER_MATRIC)
 *
 * `BOARD_KEY` = {@link normalizeBoardKey} (uppercase, alphanumeric + underscores).
 *
 * Fallbacks: school → STRIPE_PRICE_SCHOOL_ORG → STRIPE_PRICE_SCHOOL_PRO.
 * Role → role-wide env (STRIPE_PRICE_STUDENT, …) → STRIPE_PRICE_SCHOOL_PRO.
 */

export function priceIdForSchool(board: string): string {
  const key = normalizeBoardKey(board);
  const specific = env(`STRIPE_PRICE_SCHOOL_${key}`);
  if (specific) {
    return specific;
  }
  return (
    cleanEnv(process.env.STRIPE_PRICE_SCHOOL_ORG) ||
    cleanEnv(process.env.STRIPE_PRICE_SCHOOL_PRO) ||
    ""
  );
}

export function priceIdForRole(role: PlatformRole, board: string): string {
  const key = normalizeBoardKey(board);
  const roleUpper = role.toUpperCase().replace(/[^A-Z0-9]/g, "_");
  const byBoard = env(`STRIPE_PRICE_${roleUpper}_${key}`);
  if (byBoard) {
    return byBoard;
  }
  const roleWide = ROLE_ENV[role];
  if (roleWide) {
    const v = env(roleWide);
    if (v) return v;
  }
  return cleanEnv(process.env.STRIPE_PRICE_SCHOOL_PRO) || "";
}
