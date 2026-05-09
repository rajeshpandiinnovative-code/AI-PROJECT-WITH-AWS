"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auth } from "@/auth";
import { db } from "@/src/lib/db";
import { interventionTasks } from "@/src/db/schema";

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

  revalidatePath("/dashboard");
}
