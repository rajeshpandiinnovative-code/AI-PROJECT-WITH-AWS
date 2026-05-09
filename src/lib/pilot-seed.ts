import { asc, eq } from "drizzle-orm";

import { db } from "@/src/lib/db";
import { exams, students } from "@/src/db/schema";

/**
 * Ensure each claimed school has at least one student and one exam so the scan flow
 * can run end-to-end without manual DB setup.
 */
export async function ensurePilotDemoForSchool(schoolId: string): Promise<{
  demoStudentId: string;
  demoExamId: string;
}> {
  let [rowStudent] = await db
    .select({ id: students.id })
    .from(students)
    .where(eq(students.schoolId, schoolId))
    .orderBy(asc(students.createdAt))
    .limit(1);

  if (!rowStudent) {
    const [created] = await db
      .insert(students)
      .values({
        schoolId,
        name: "Pilot demo student",
        rollNo: "PILOT-001",
      })
      .returning({ id: students.id });
    if (!created) throw new Error("Failed to create pilot student");
    rowStudent = created;
  }

  let [rowExam] = await db
    .select({ id: exams.id })
    .from(exams)
    .where(eq(exams.schoolId, schoolId))
    .orderBy(asc(exams.createdAt))
    .limit(1);

  if (!rowExam) {
    const today = new Date().toISOString().slice(0, 10);
    const [created] = await db
      .insert(exams)
      .values({
        schoolId,
        name: "Pilot demo assessment",
        date: today,
      })
      .returning({ id: exams.id });
    if (!created) throw new Error("Failed to create pilot exam");
    rowExam = created;
  }

  return {
    demoStudentId: rowStudent.id,
    demoExamId: rowExam.id,
  };
}
