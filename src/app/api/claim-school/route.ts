import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/src/lib/db";
import { globalSchools, schools } from "@/src/db/schema";
import { isOnboardingDemoSeedEnabled } from "@/src/lib/env";
import { ensurePilotDemoForSchool } from "@/src/lib/pilot-seed";

const TRIAL_MS = 14 * 24 * 60 * 60 * 1000;

type ClaimBody = {
  udiseCode?: string;
};

/**
 * Create or resolve a `schools` tenant from `global_schools` and return onboarding defaults.
 */
export async function POST(req: Request) {
  let body: ClaimBody;
  try {
    body = (await req.json()) as ClaimBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const udise = String(body.udiseCode ?? "").replace(/\D/g, "");
  if (!/^\d{11}$/.test(udise)) {
    return NextResponse.json({ error: "A valid 11-digit UDISE code is required." }, { status: 400 });
  }

  const [dir] = await db
    .select()
    .from(globalSchools)
    .where(eq(globalSchools.udiseCode, udise))
    .limit(1);

  if (!dir) {
    return NextResponse.json(
      { error: "This UDISE was not found in the school directory. Check the code or import updated directory data." },
      { status: 404 },
    );
  }

  const [existing] = await db
    .select({ id: schools.id, name: schools.name })
    .from(schools)
    .where(eq(schools.udiseCode, udise))
    .limit(1);

  let schoolId: string;
  let schoolName: string;
  let created = false;

  if (existing) {
    schoolId = existing.id;
    schoolName = existing.name;
  } else {
    try {
      const trialEnd = new Date(Date.now() + TRIAL_MS);
      const [inserted] = await db
        .insert(schools)
        .values({
          udiseCode: udise,
          name: dir.schoolName,
          district: dir.districtName?.trim() || "Unknown",
          board: dir.boardName?.trim() || "MATRIC",
          subscriptionStatus: "trial",
          subscriptionTrialEndsAt: trialEnd,
        })
        .returning({ id: schools.id, name: schools.name });

      if (!inserted) {
        return NextResponse.json({ error: "Could not create school tenant." }, { status: 500 });
      }
      schoolId = inserted.id;
      schoolName = inserted.name;
      created = true;
    } catch {
      const [again] = await db
        .select({ id: schools.id, name: schools.name })
        .from(schools)
        .where(eq(schools.udiseCode, udise))
        .limit(1);
      if (!again) {
        return NextResponse.json({ error: "Could not resolve school tenant." }, { status: 409 });
      }
      schoolId = again.id;
      schoolName = again.name;
      created = false;
    }
  }

  let demoStudentId: string | null = null;
  let demoExamId: string | null = null;
  if (isOnboardingDemoSeedEnabled()) {
    const demo = await ensurePilotDemoForSchool(schoolId);
    demoStudentId = demo.demoStudentId;
    demoExamId = demo.demoExamId;
  }

  return NextResponse.json({
    schoolId,
    schoolName,
    created,
    demoStudentId,
    demoExamId,
  });
}
