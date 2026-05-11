import type { PlatformRole } from "@/src/lib/platform-roles";
import { cleanEnv } from "@/src/lib/env";
import { normalizeBoardKey } from "@/src/lib/board-billing";

function env(name: string): string {
  return cleanEnv(process.env[name]);
}

const ROLE_ENV: Record<PlatformRole, string> = {
  student: "STRIPE_PRICE_STUDENT",
  parent: "STRIPE_PRICE_PARENT",
  teacher: "STRIPE_PRICE_TEACHER",
  admin: "STRIPE_PRICE_ADMIN",
  management: "STRIPE_PRICE_MANAGEMENT",
  school_org: "STRIPE_PRICE_SCHOOL_ORG_USER",
  master_admin: "STRIPE_PRICE_MASTER_ADMIN",
};

/**
 * Stripe Price IDs are resolved by **board** + product:
 *
 * - School tenant: `STRIPE_PRICE_SCHOOL_<BOARD_KEY>` (e.g. STRIPE_PRICE_SCHOOL_MATRIC)
 * - Individual role: `STRIPE_PRICE_<ROLE>_<BOARD_KEY>` (e.g. STRIPE_PRICE_STUDENT_MATRIC)
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
  const roleWide = env(ROLE_ENV[role]);
  if (roleWide) {
    return roleWide;
  }
  return cleanEnv(process.env.STRIPE_PRICE_SCHOOL_PRO) || "";
}
