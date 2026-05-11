import { and, desc, eq } from "drizzle-orm";

import { db } from "@/src/lib/db";
import { interventionAuditLogs, interventionDailyDigests, interventionTasks } from "@/src/db/schema";

type DigestStudent = {
  studentName: string;
  marks: number;
  recommendedModule: string;
};

export type DailyDigestSummary = {
  openCount: number;
  overdueCount: number;
  criticalCount: number;
  topAtRiskStudents: DigestStudent[];
  generatedAt: string;
};

export async function generateDailyDigestForSchool(
  schoolId: string,
  source: "manual" | "cron" = "manual",
): Promise<{ digestDate: string; summary: DailyDigestSummary }> {
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

  const summary: DailyDigestSummary = {
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
    actionType: source === "cron" ? "daily_digest_generate_cron" : "daily_digest_generate",
    affectedCount: 1,
    metadata: { digestDate, ...summary },
  });

  return { digestDate, summary };
}
