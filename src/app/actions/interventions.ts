"use server";

import { and, desc, eq, inArray, lt } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auth } from "@/auth";
import { db } from "@/src/lib/db";
import { interventionAuditLogs, interventionDailyDigests, interventionTasks } from "@/src/db/schema";

const createInterventionSchema = z.object({
  sourceResultId: z.string().uuid(),
  studentName: z.string().min(1).max(255),
  examName: z.string().min(1).max(255),
  marks: z.number().int().min(0).max(100),
  recommendedModule: z.string().min(1).max(128),
});

async function getCurrentSessionSchoolId(): Promise<string> {
  const session = await auth();
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

type DigestStudent = {
  studentName: string;
  marks: number;
  recommendedModule: string;
};

export async function generateDailyInterventionDigest() {
  const schoolId = await getCurrentSessionSchoolId();
  const now = new Date();
  const digestDate = now.toISOString().slice(0, 10);
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const tasks = await db.query.interventionTasks.findMany({
    where: eq(interventionTasks.schoolId, schoolId),
    orderBy: [desc(interventionTasks.createdAt)],
    limit: 1000,
  });

  const openTasks = tasks.filter((task) => task.status !== "completed");
  const overdueTasks = openTasks.filter((task) => task.createdAt < threeDaysAgo);
  const criticalTasks = openTasks.filter((task) => task.createdAt < sevenDaysAgo);

  const byStudent = new Map<string, DigestStudent>();
  for (const task of openTasks.sort((a, b) => a.marks - b.marks)) {
    if (!byStudent.has(task.studentName)) {
      byStudent.set(task.studentName, {
        studentName: task.studentName,
        marks: task.marks,
        recommendedModule: task.recommendedModule,
      });
    }
    if (byStudent.size >= 5) break;
  }

  const summary = {
    openCount: openTasks.length,
    overdueCount: overdueTasks.length,
    criticalCount: criticalTasks.length,
    topAtRiskStudents: [...byStudent.values()],
    generatedAt: now.toISOString(),
  };

  const [existing] = await db
    .select({ id: interventionDailyDigests.id })
    .from(interventionDailyDigests)
    .where(and(eq(interventionDailyDigests.schoolId, schoolId), eq(interventionDailyDigests.digestDate, digestDate)))
    .limit(1);

  if (existing) {
    await db
      .update(interventionDailyDigests)
      .set({ summary, updatedAt: new Date() })
      .where(eq(interventionDailyDigests.id, existing.id));
  } else {
    await db.insert(interventionDailyDigests).values({
      schoolId,
      digestDate,
      summary,
    });
  }

  await db.insert(interventionAuditLogs).values({
    schoolId,
    actionType: "daily_digest_generate",
    affectedCount: 1,
    metadata: { digestDate, openCount: openTasks.length, overdueCount: overdueTasks.length, criticalCount: criticalTasks.length },
  });

  revalidatePath("/dashboard");
}
