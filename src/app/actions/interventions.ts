"use server";

import { and, eq, inArray, lt } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auth } from "@/auth";
import { db } from "@/src/lib/db";
import { interventionAuditLogs, interventionTasks } from "@/src/db/schema";
import { generateDailyDigestForSchool } from "@/src/lib/intervention-digest";
import { isFounderSuperAdmin, sessionAppRole } from "@/src/lib/rbac";
import { assertPaidAccessFromSession } from "@/src/lib/subscription";

const createInterventionSchema = z.object({
  sourceResultId: z.string().uuid(),
  studentName: z.string().min(1).max(255),
  examName: z.string().min(1).max(255),
  marks: z.number().int().min(0).max(100),
  recommendedModule: z.string().min(1).max(128),
});

async function getCurrentSessionSchoolId(): Promise<string> {
  const session = await auth();
  await assertPaidAccessFromSession(session);
  if (!isFounderSuperAdmin(session) && sessionAppRole(session) !== "PRINCIPAL") {
    throw new Error("Forbidden: principal access required");
  }
  const schoolId = session?.user?.schoolId;
  if (!schoolId) throw new Error("Unauthorized: school context missing in session");
  return schoolId;
}

export async function assignIntervention(input: z.infer<typeof createInterventionSchema>) {
  const schoolId = await getCurrentSessionSchoolId();
  const parsed = createInterventionSchema.parse(input);

  const [existing] = await db
    .select({ id: interventionTasks.id })
    .from(interventionTasks)
    .where(
      and(
        eq(interventionTasks.schoolId, schoolId),
        eq(interventionTasks.sourceResultId, parsed.sourceResultId),
        eq(interventionTasks.status, "assigned"),
      ),
    )
    .limit(1);

  if (!existing) {
    await db.insert(interventionTasks).values({
      schoolId,
      sourceResultId: parsed.sourceResultId,
      studentName: parsed.studentName,
      examName: parsed.examName,
      marks: parsed.marks,
      recommendedModule: parsed.recommendedModule,
      status: "assigned",
    });
    await db.insert(interventionAuditLogs).values({
      schoolId,
      actionType: "single_assign",
      affectedCount: 1,
      metadata: { sourceResultId: parsed.sourceResultId, studentName: parsed.studentName },
    });
  }

  revalidatePath("/dashboard");
}

export async function completeIntervention(taskId: string) {
  const schoolId = await getCurrentSessionSchoolId();
  const parsedTaskId = z.string().uuid().parse(taskId);

  await db
    .update(interventionTasks)
    .set({ status: "completed", updatedAt: new Date() })
    .where(and(eq(interventionTasks.id, parsedTaskId), eq(interventionTasks.schoolId, schoolId)));

  await db.insert(interventionAuditLogs).values({
    schoolId,
    actionType: "single_complete",
    affectedCount: 1,
    metadata: { taskId: parsedTaskId },
  });

  revalidatePath("/dashboard");
}

export async function bulkFollowUpOverdueInterventions() {
  const schoolId = await getCurrentSessionSchoolId();
  const cutoff = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

  const overdueAssigned = await db
    .select({ id: interventionTasks.id })
    .from(interventionTasks)
    .where(
      and(
        eq(interventionTasks.schoolId, schoolId),
        eq(interventionTasks.status, "assigned"),
        lt(interventionTasks.createdAt, cutoff),
      ),
    )
    .limit(50);

  if (overdueAssigned.length === 0) {
    await db.insert(interventionAuditLogs).values({
      schoolId,
      actionType: "bulk_followup_overdue",
      affectedCount: 0,
      metadata: { note: "no-op" },
    });
    revalidatePath("/dashboard");
    return;
  }

  await db
    .update(interventionTasks)
    .set({ updatedAt: new Date() })
    .where(
      and(
        eq(interventionTasks.schoolId, schoolId),
        inArray(
          interventionTasks.id,
          overdueAssigned.map((row) => row.id),
        ),
      ),
    );

  await db.insert(interventionAuditLogs).values({
    schoolId,
    actionType: "bulk_followup_overdue",
    affectedCount: overdueAssigned.length,
    metadata: { limit: 50 },
  });

  revalidatePath("/dashboard");
}

export async function bulkCompleteOverdueInterventions() {
  const schoolId = await getCurrentSessionSchoolId();
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const criticalOverdue = await db
    .select({ id: interventionTasks.id })
    .from(interventionTasks)
    .where(
      and(
        eq(interventionTasks.schoolId, schoolId),
        eq(interventionTasks.status, "assigned"),
        lt(interventionTasks.createdAt, cutoff),
      ),
    )
    .limit(25);

  if (criticalOverdue.length === 0) {
    await db.insert(interventionAuditLogs).values({
      schoolId,
      actionType: "bulk_complete_critical",
      affectedCount: 0,
      metadata: { note: "no-op" },
    });
    revalidatePath("/dashboard");
    return;
  }

  await db
    .update(interventionTasks)
    .set({ status: "completed", updatedAt: new Date() })
    .where(
      and(
        eq(interventionTasks.schoolId, schoolId),
        inArray(
          interventionTasks.id,
          criticalOverdue.map((row) => row.id),
        ),
      ),
    );

  await db.insert(interventionAuditLogs).values({
    schoolId,
    actionType: "bulk_complete_critical",
    affectedCount: criticalOverdue.length,
    metadata: { limit: 25 },
  });

  revalidatePath("/dashboard");
}

export async function generateDailyInterventionDigest() {
  const schoolId = await getCurrentSessionSchoolId();
  await generateDailyDigestForSchool(schoolId, "manual");

  revalidatePath("/dashboard");
}
