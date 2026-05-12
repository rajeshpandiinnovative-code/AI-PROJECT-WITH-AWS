import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import type { DemoContextCookie } from "@/src/lib/dashboard-chart-data";
import { parseDemoCookie } from "@/src/lib/dashboard-chart-data";
import { getDemoSessionById, insertDemoSessionEvent } from "@/src/lib/demo-session";
import { cleanEnv } from "@/src/lib/env";
import type { Session } from "next-auth";

import { auth } from "@/auth";
import { isModuleSlugVisible, visibilityRoleFromSession } from "@/src/lib/module-visibility";
import { allModules } from "@/src/lib/modules";

const DEMO_TENANT_PREFIX = "demo:";

/** Tenant key used for module_histories rows created during a tracked demo session. */
export function demoTenantSchoolId(sessionId: string): string {
  return `${DEMO_TENANT_PREFIX}${sessionId}`;
}

export function isDemoTenantSchoolId(schoolId: string): boolean {
  return schoolId.startsWith(DEMO_TENANT_PREFIX);
}

export async function getActiveDemoSessionFromCookies(): Promise<{
  id: string;
  role: string;
  expiresAt: Date;
  profile: DemoContextCookie;
} | null> {
  const store = await cookies();
  const profile = parseDemoCookie(store.get("aap_demo")?.value);
  if (!profile?.sessionId) {
    return null;
  }
  const row = await getDemoSessionById(profile.sessionId);
  if (!row) {
    return null;
  }
  const now = Date.now();
  if (row.expiresAt.getTime() <= now) {
    return null;
  }
  return {
    id: row.id,
    role: row.role,
    expiresAt: row.expiresAt,
    profile,
  };
}

/**
 * When paid mode is on, anonymous users with a valid demo session get the same API allowance
 * as subscribed users for the lifetime of that session.
 */
function isPaidSubscriptionEnforcedEnv(): boolean {
  return cleanEnv(process.env.REQUIRE_PAID_SUBSCRIPTION).toLowerCase() === "true";
}

export async function hasActiveDemoSubscriptionBypass(): Promise<boolean> {
  if (!isPaidSubscriptionEnforcedEnv()) {
    return false;
  }
  const demo = await getActiveDemoSessionFromCookies();
  return demo !== null;
}

/** Demo sessions use the same visibility matrix with school treated as unlocked for the trial window. */
export function demoRoleAllowsModuleSlug(role: string, slug: string): boolean {
  return isModuleSlugVisible({ role, slug, schoolUnlocked: true });
}

export async function requireModulesViewerOrRedirect(): Promise<
  | { mode: "auth"; session: Session }
  | { mode: "demo"; demo: NonNullable<Awaited<ReturnType<typeof getActiveDemoSessionFromCookies>>> }
> {
  const session = await auth();
  if (session?.user) {
    return { mode: "auth", session };
  }
  const demo = await getActiveDemoSessionFromCookies();
  if (demo) {
    return { mode: "demo", demo };
  }
  /** Demo login UI is optional (SHOW_DEMO); send users to standard login by default. */
  redirect("/login?reason=session");
}

export async function logDemoModuleView(sessionId: string, slug: string, title: string) {
  try {
    await insertDemoSessionEvent(sessionId, "module_view", { slug, title });
  } catch {
    /* non-fatal */
  }
}

/** Best-effort audit when a demo browser calls module AI APIs (no-op if not in a demo session). */
export async function logDemoApiUse(eventType: string, payload: Record<string, unknown> = {}) {
  try {
    const d = await getActiveDemoSessionFromCookies();
    if (!d) return;
    await insertDemoSessionEvent(d.id, eventType, payload);
  } catch {
    /* ignore */
  }
}

export async function assertModulePageAccessOrRedirect(slug: string): Promise<{
  mode: "auth";
  session: Session;
} | {
  mode: "demo";
  demo: NonNullable<Awaited<ReturnType<typeof getActiveDemoSessionFromCookies>>>;
}> {
  const access = await requireModulesViewerOrRedirect();
  if (!allModules.some((m) => m.slug === slug)) {
    redirect("/modules");
  }
  if (access.mode === "auth") {
    const { resolveSchoolUnlockedFromSession } = await import("@/src/lib/subscription");
    const unlocked = await resolveSchoolUnlockedFromSession(access.session);
    const role = visibilityRoleFromSession(access.session);
    if (!isModuleSlugVisible({ role, slug, schoolUnlocked: unlocked, session: access.session })) {
      redirect("/modules?reason=visibility");
    }
    return access;
  }
  if (!isModuleSlugVisible({ role: access.demo.role, slug, schoolUnlocked: true })) {
    redirect("/modules?reason=visibility");
  }
  return access;
}

/** @deprecated Use `assertModulePageAccessOrRedirect` */
export const assertDemoCanOpenModuleOrRedirect = assertModulePageAccessOrRedirect;
