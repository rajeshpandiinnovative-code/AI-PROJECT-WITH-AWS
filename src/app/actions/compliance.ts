"use server";

import { eq, and, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auth } from "@/auth";
import { db } from "@/src/lib/db";
import { lessonLogs, students } from "@/src/db/schema";

const logLessonSchema = z.object({
  studentId: z.string().uuid(),
  cbseSkillCode: z.string().min(1).max(64),
  sessionDuration: z.number().int().positive().max(480),
  masteryScore: z.number().min(0).max(100),
});

export type LogLessonInput = z.infer<typeof logLessonSchema>;

async function requireTeacherSchoolId(): Promise<{ teacherId: string; schoolId: string }> {
  const session = await auth();
  const schoolId = session?.user?.schoolId;
  const teacherId = session?.user?.id;

  if (!schoolId || !teacherId) {
    throw new Error("Unauthorized: teacher session with school context required");
  }

  return { teacherId, schoolId };
}

export async function logLessonSession(input: LogLessonInput) {
  const parsed = logLessonSchema.parse(input);
  const { teacherId, schoolId } = await requireTeacherSchoolId();

  const [student] = await db
    .select({ id: students.id, schoolId: students.schoolId })
    .from(students)
    .where(eq(students.id, parsed.studentId))
    .limit(1);

  if (!student) throw new Error("Student not found");
  if (student.schoolId !== schoolId) throw new Error("Forbidden: student does not belong to current school");

  const isCompliant = parsed.masteryScore >= 70;

  await db.insert(lessonLogs).values({
    schoolId,
    teacherId,
    studentId: parsed.studentId,
    cbseSkillCode: parsed.cbseSkillCode,
    sessionDuration: parsed.sessionDuration,
    masteryScore: parsed.masteryScore,
    isCompliant,
  });

  revalidatePath("/teacher/dashboard");
  return { success: true, isCompliant };
}

export type ComplianceSummary = {
  totalMinutes: number;
  totalHours: number;
  mandateHours: number;
  percentComplete: number;
  compliantSessions: number;
  totalSessions: number;
  /** Institutional Readiness Score: % of sessions that are compliant (mastery >= 70). */
  readinessScore: number;
};

export async function getComplianceSummary(): Promise<ComplianceSummary> {
  const { teacherId, schoolId } = await requireTeacherSchoolId();

  const [row] = await db
    .select({
      totalMinutes: sql<number>`coalesce(sum(${lessonLogs.sessionDuration}), 0)`,
      compliantSessions: sql<number>`coalesce(sum(case when ${lessonLogs.isCompliant} then 1 else 0 end), 0)`,
      totalSessions: sql<number>`count(*)`,
    })
    .from(lessonLogs)
    .where(and(eq(lessonLogs.teacherId, teacherId), eq(lessonLogs.schoolId, schoolId)));

  const totalMinutes = Number(row.totalMinutes);
  const totalHours = totalMinutes / 60;
  const mandateHours = 20;

  const total = Number(row.totalSessions);
  const compliant = Number(row.compliantSessions);

  return {
    totalMinutes,
    totalHours: Math.round(totalHours * 10) / 10,
    mandateHours,
    percentComplete: Math.min(100, Math.round((totalHours / mandateHours) * 100)),
    compliantSessions: compliant,
    totalSessions: total,
    readinessScore: total > 0 ? Math.round((compliant / total) * 100) : 0,
  };
}
