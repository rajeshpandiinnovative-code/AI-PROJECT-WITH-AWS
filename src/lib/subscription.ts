import type { Session } from "next-auth";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/src/lib/db";
import { platformUsers, schools } from "@/src/db/schema";
import { hasActiveDemoSubscriptionBypass } from "@/src/lib/demo-access";
import { cleanEnv } from "@/src/lib/env";
import { isMasterAdminSession } from "@/src/lib/master-admin";
import { resolveSessionTenantIds } from "@/src/lib/session-tenant";

/** When true (production SaaS), APIs enforce trial window + Stripe subscription. */
export function isPaidSubscriptionEnforced(): boolean {
  return cleanEnv(process.env.REQUIRE_PAID_SUBSCRIPTION).toLowerCase() === "true";
}

const ACTIVE_STATUSES = new Set(["active", "trialing"]);

function paidRowAllowed(
  row: {
    subscriptionStatus: string | null;
    subscriptionTrialEndsAt: Date | null;
    subscriptionCurrentPeriodEnd: Date | null;
  } | undefined,
): boolean {
  if (!row) {
    return false;
  }

  const now = Date.now();
  const status = row.subscriptionStatus ?? "";

  if (ACTIVE_STATUSES.has(status)) {
    const periodEnd = row.subscriptionCurrentPeriodEnd;
    if (periodEnd && periodEnd.getTime() < now) {
      return false;
    }
    return true;
  }

  if (status === "trial") {
    const trialEnd = row.subscriptionTrialEndsAt;
    return trialEnd ? trialEnd.getTime() > now : false;
  }

  return false;
}

export async function schoolHasPaidAccess(schoolId: string): Promise<boolean> {
  if (!isPaidSubscriptionEnforced()) {
    return true;
  }

  const row = await db.query.schools.findFirst({
    where: eq(schools.id, schoolId),
    columns: {
      subscriptionStatus: true,
      subscriptionTrialEndsAt: true,
      subscriptionCurrentPeriodEnd: true,
    },
  });

  return paidRowAllowed(row ?? undefined);
}

export async function platformUserHasPaidAccess(userId: string): Promise<boolean> {
  if (!isPaidSubscriptionEnforced()) {
    return true;
  }

  const row = await db.query.platformUsers.findFirst({
    where: eq(platformUsers.id, userId),
    columns: {
      subscriptionStatus: true,
      subscriptionTrialEndsAt: true,
      subscriptionCurrentPeriodEnd: true,
    },
  });

  return paidRowAllowed(row ?? undefined);
}

/**
 * Paid access for the current session:
 * - School-only login → school subscription / trial.
 * - Platform user (student, parent, teacher, …) → that user's subscription / trial (independent of school billing).
 */
export async function sessionHasPaidAccess(session: Session | null): Promise<boolean> {
  if (!session?.user) {
    return false;
  }
  if (!isPaidSubscriptionEnforced()) {
    return true;
  }
  if (isMasterAdminSession(session)) {
    return true;
  }

  const { platformUserId, schoolId } = resolveSessionTenantIds(session);
  if (platformUserId) {
    return platformUserHasPaidAccess(platformUserId);
  }

  if (schoolId) {
    return schoolHasPaidAccess(schoolId);
  }

  return false;
}

/** For server actions: paid gate using full session (school tenant or platform user). */
export async function assertPaidAccessFromSession(session: Session | null): Promise<void> {
  if (!isPaidSubscriptionEnforced()) {
    return;
  }
  if (!(await sessionHasPaidAccess(session))) {
    throw new Error("SUBSCRIPTION_REQUIRED");
  }
}

/** @deprecated Use assertPaidAccessFromSession — kept for incremental refactors */
export async function assertPaidSchoolThrows(schoolId: string): Promise<void> {
  if (!isPaidSubscriptionEnforced()) {
    return;
  }
  if (!(await schoolHasPaidAccess(schoolId))) {
    throw new Error("SUBSCRIPTION_REQUIRED");
  }
}

/**
 * Returns a NextResponse when access must be blocked (401 / 402). Otherwise null.
 */
export async function paidAccessGuardResponse(session: Session | null): Promise<NextResponse | null> {
  if (!isPaidSubscriptionEnforced()) {
    return null;
  }
  if (session?.user) {
    const ok = await sessionHasPaidAccess(session);
    if (!ok) {
      return NextResponse.json(
        {
          error: "Subscription required",
          code: "SUBSCRIPTION_REQUIRED",
          message: "Choose a paid plan for your role or school to use this feature.",
        },
        { status: 402 },
      );
    }
    return null;
  }
  if (await hasActiveDemoSubscriptionBypass()) {
    return null;
  }
  return NextResponse.json({ error: "Unauthorized", code: "AUTH_REQUIRED" }, { status: 401 });
}

/**
 * Institution “unlock” for UI module visibility: mirrors paid access for the signed-in tenant.
 * When `REQUIRE_PAID_SUBSCRIPTION` is off, always true. Used by `/modules` and module detail gates.
 */
export async function resolveSchoolUnlockedFromSession(session: Session | null): Promise<boolean> {
  if (!isPaidSubscriptionEnforced()) {
    return true;
  }
  if (!session?.user) {
    return false;
  }
  return sessionHasPaidAccess(session);
}

/** Legacy helper — prefer paidAccessGuardResponse(session). */
export async function paidSchoolGuardResponse(schoolId: string | undefined): Promise<NextResponse | null> {
  if (!isPaidSubscriptionEnforced()) {
    return null;
  }
  if (!schoolId) {
    return NextResponse.json({ error: "Unauthorized", code: "AUTH_REQUIRED" }, { status: 401 });
  }
  const ok = await schoolHasPaidAccess(schoolId);
  if (!ok) {
    return NextResponse.json(
      {
        error: "Subscription required",
        code: "SUBSCRIPTION_REQUIRED",
        message: "Start or renew your school subscription to use this feature.",
      },
      { status: 402 },
    );
  }
  return null;
}
