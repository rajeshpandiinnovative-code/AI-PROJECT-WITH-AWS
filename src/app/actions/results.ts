"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auth } from "@/auth";
import { db } from "@/src/lib/db";
import { results, students } from "@/src/db/schema";

const updateStudentMarksSchema = z.object({
  studentId: z.string().uuid(),
  examId: z.string().uuid(),
  marks: z.number().finite().min(0).max(100),
});

type UpdateStudentMarksInput = z.infer<typeof updateStudentMarksSchema>;

async function getCurrentSessionSchoolId(): Promise<string> {
  const session = await auth();
  const schoolId = session?.user?.schoolId;

  if (!schoolId) {
    throw new Error("Unauthorized: school context missing in session");
  }

  return schoolId;
}

export async function updateStudentMarks(
  studentId: string,
  examId: string,
  marks: number,
) {
  const input: UpdateStudentMarksInput = updateStudentMarksSchema.parse({
    studentId,
    examId,
    marks,
  });

  const sessionSchoolId = await getCurrentSessionSchoolId();

  const [student] = await db
    .select({ id: students.id, schoolId: students.schoolId })
    .from(students)
    .where(eq(students.id, input.studentId))
    .limit(1);

  if (!student) {
    throw new Error("Student not found");
  }

  if (student.schoolId !== sessionSchoolId) {
    throw new Error("Forbidden: student does not belong to current school");
  }

  const [existingResult] = await db
    .select({ id: results.id })
    .from(results)
    .where(
      and(
        eq(results.studentId, input.studentId),
        eq(results.examId, input.examId),
        eq(results.schoolId, sessionSchoolId),
      ),
    )
    .limit(1);

  if (existingResult) {
    await db
      .update(results)
      .set({
        marks: input.marks,
        updatedAt: new Date(),
      })
      .where(eq(results.id, existingResult.id));
  } else {
    await db.insert(results).values({
      studentId: input.studentId,
      examId: input.examId,
      marks: input.marks,
      schoolId: sessionSchoolId,
    });
  }

  revalidatePath("/dashboard");
}
