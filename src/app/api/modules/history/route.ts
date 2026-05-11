import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { createModuleHistory, listModuleHistory } from "@/src/db/queries";
import { createTenantContext } from "@/src/db/tenant-context";
import { withTenant } from "@/src/db/tenant";
import { demoTenantSchoolId, getActiveDemoSessionFromCookies, logDemoApiUse } from "@/src/lib/demo-access";
import {
  isPaidSubscriptionEnforced,
  paidAccessGuardResponse,
  sessionHasPaidAccess,
} from "@/src/lib/subscription";

const createHistorySchema = z.object({
  moduleSlug: z.string().min(1).max(128),
  moduleTitle: z.string().min(1).max(255),
  inputData: z.unknown(),
  outputData: z.unknown(),
});

async function resolveHistoryTenant() {
  const session = await auth();
  const schoolId = session?.user?.schoolId?.trim();
  if (schoolId) {
    return createTenantContext(session);
  }
  const demo = await getActiveDemoSessionFromCookies();
  if (demo) {
    return withTenant({ schoolId: demoTenantSchoolId(demo.id) });
  }
  return null;
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    const blocked = await paidAccessGuardResponse(session);
    if (blocked) {
      return blocked;
    }
    const tenant = await resolveHistoryTenant();
    if (!tenant) {
      return NextResponse.json(
        { error: "Sign in with a school account or start a demo session to save module history." },
        { status: 401 },
      );
    }
    const payload = await request.json();
    const parsed = createHistorySchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const data = await createModuleHistory(tenant, parsed.data);
    await logDemoApiUse("module_history_saved", {
      moduleSlug: parsed.data.moduleSlug,
      moduleTitle: parsed.data.moduleTitle,
    });
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save module history";
    const status = message.includes("Tenant context") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function GET(request: Request) {
  try {
    const session = await auth();
    const schoolId = session?.user?.schoolId?.trim();

    if (schoolId) {
      if (isPaidSubscriptionEnforced() && !(await sessionHasPaidAccess(session))) {
        return NextResponse.json({ data: [] }, { status: 200 });
      }
    } else if (isPaidSubscriptionEnforced() && !session?.user) {
      const blocked = await paidAccessGuardResponse(session);
      if (blocked) {
        return blocked;
      }
    }

    const tenant = await resolveHistoryTenant();
    if (!tenant) {
      return NextResponse.json({ data: [] }, { status: 200 });
    }

    const { searchParams } = new URL(request.url);
    const moduleSlug = searchParams.get("moduleSlug");
    const limitParam = searchParams.get("limit");

    if (!moduleSlug) {
      return NextResponse.json({ error: "moduleSlug is required" }, { status: 400 });
    }

    const parsedLimit = limitParam ? Number(limitParam) : 10;
    if (!Number.isInteger(parsedLimit) || parsedLimit <= 0) {
      return NextResponse.json({ error: "limit must be a positive integer" }, { status: 400 });
    }

    const data = await listModuleHistory(tenant, moduleSlug, parsedLimit);
    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to fetch module history";
    const status = message.includes("Tenant context") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
