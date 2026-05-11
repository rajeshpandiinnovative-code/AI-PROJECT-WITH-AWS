import type { Session } from "next-auth";

import { isMasterAdminSession } from "@/src/lib/master-admin";
import type { ModulePillar } from "@/src/lib/modules";
import { modulePillars } from "@/src/lib/modules";
import type { PlatformRole } from "@/src/lib/platform-roles";
import { PLATFORM_ROLES } from "@/src/lib/platform-roles";

/** How modules appear in catalog + deep links for a role when the school is not “unlocked”. */
export type RoleModuleRule =
  | { kind: "all" }
  | { kind: "allow"; slugs: readonly string[] }
  | { kind: "deny"; slugs: readonly string[] };

/**
 * Per-role visibility when `schoolUnlocked` is false (see `resolveSchoolUnlockedFromSession` in
 * `subscription.ts`). When `schoolUnlocked` is true, every slug is visible regardless of these rules.
 *
 * Edit `allow` / `deny` lists here as you define permission levels; keys must stay in sync with auth.
 */
export const MODULE_VISIBILITY_BY_ROLE: Record<PlatformRole | "school", RoleModuleRule> = {
  student: { kind: "all" },
  parent: { kind: "all" },
  teacher: { kind: "all" },
  admin: { kind: "all" },
  management: { kind: "all" },
  school_org: { kind: "all" },
  master_admin: { kind: "all" },
  /** School UUID login (tenant session) — not a platform role, but has its own row here. */
  school: { kind: "all" },
};

function ruleForRole(role: string): RoleModuleRule {
  if (role === "school") {
    return MODULE_VISIBILITY_BY_ROLE.school;
  }
  if (PLATFORM_ROLES.includes(role as PlatformRole)) {
    return MODULE_VISIBILITY_BY_ROLE[role as PlatformRole];
  }
  return { kind: "all" };
}

function slugMatchesRule(rule: RoleModuleRule, slug: string): boolean {
  if (rule.kind === "all") return true;
  if (rule.kind === "allow") return rule.slugs.includes(slug);
  return !rule.slugs.includes(slug);
}

/** Map NextAuth session to a visibility role key (`school` for tenant-only JWT). */
export function visibilityRoleFromSession(session: Session | null): string {
  if (!session?.user) {
    return "student";
  }
  if (session.user.authSubject === "school") {
    return "school";
  }
  const r = session.user.role;
  if (typeof r === "string" && r.length > 0) {
    return r;
  }
  return "student";
}

export function isModuleSlugVisible(params: {
  role: string;
  slug: string;
  schoolUnlocked: boolean;
  /** When set, master emails always see the module (see `MASTER_ADMIN_EMAILS`). */
  session?: Session | null;
}): boolean {
  if (params.session && isMasterAdminSession(params.session)) {
    return true;
  }
  if (params.schoolUnlocked) {
    return true;
  }
  return slugMatchesRule(ruleForRole(params.role), params.slug);
}

export function filterModulePillarsByVisibility(
  pillars: readonly ModulePillar[],
  role: string,
  schoolUnlocked: boolean,
  session?: Session | null,
): ModulePillar[] {
  if (session && isMasterAdminSession(session)) {
    return pillars.map((p) => ({ ...p, modules: [...p.modules] }));
  }
  return pillars
    .map((pillar) => ({
      ...pillar,
      modules: pillar.modules.filter((m) =>
        isModuleSlugVisible({ role, slug: m.slug, schoolUnlocked, session }),
      ),
    }))
    .filter((p) => p.modules.length > 0);
}

export function getDefaultFilteredPillars(
  role: string,
  schoolUnlocked: boolean,
  session?: Session | null,
): ModulePillar[] {
  if (session && isMasterAdminSession(session)) {
    return modulePillars.map((p) => ({ ...p, modules: [...p.modules] }));
  }
  return filterModulePillarsByVisibility(modulePillars, role, schoolUnlocked, session);
}
