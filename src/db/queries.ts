import { and, desc, eq, lt } from "drizzle-orm";

import { db } from "./client";
import { exams, moduleHistories, results, students } from "./schema";
import { type TenantContext, withTenant } from "./tenant";

type CreateStudentInput = {
  name: string;
  rollNo: string;
};

type CreateExamInput = {
  name: string;
  date: string;
};

type RecordResultInput = {
  studentId: string;
  examId: string;
  marks: number;
};

export async function createStudent(ctx: TenantContext, input: CreateStudentInput) {
  const tenant = withTenant(ctx);

  const [student] = await db
    .insert(students)
    .values({
      schoolId: tenant.schoolId,
      name: input.name,
      rollNo: input.rollNo,
    })
    .returning();

  return student;
}

export async function listStudents(ctx: TenantContext) {
  const tenant = withTenant(ctx);

  return db.query.students.findMany({
    where: eq(students.schoolId, tenant.schoolId),
    orderBy: [students.rollNo],
  });
}

export async function createExam(ctx: TenantContext, input: CreateExamInput) {
  const tenant = withTenant(ctx);

  const [exam] = await db
    .insert(exams)
    .values({
      schoolId: tenant.schoolId,
      name: input.name,
      date: input.date,
    })
    .returning();

  return exam;
}

export async function listExams(ctx: TenantContext) {
  const tenant = withTenant(ctx);

  return db.query.exams.findMany({
    where: eq(exams.schoolId, tenant.schoolId),
    orderBy: [desc(exams.date)],
  });
}

export async function recordResult(ctx: TenantContext, input: RecordResultInput) {
  const tenant = withTenant(ctx);

  return db.transaction(async (tx) => {
    const [student] = await tx
      .select({ id: students.id })
      .from(students)
      .where(and(eq(students.id, input.studentId), eq(students.schoolId, tenant.schoolId)))
      .limit(1);

    const [exam] = await tx
      .select({ id: exams.id })
      .from(exams)
      .where(and(eq(exams.id, input.examId), eq(exams.schoolId, tenant.schoolId)))
      .limit(1);

    if (!student || !exam) {
      throw new Error("Student or exam not found in this school");
    }

    const [result] = await tx
      .insert(results)
      .values({
        schoolId: tenant.schoolId,
        studentId: input.studentId,
        examId: input.examId,
        marks: input.marks,
      })
      .returning();

    return result;
  });
}

export async function listResultsForExam(ctx: TenantContext, examId: string) {
  const tenant = withTenant(ctx);

  return db.query.results.findMany({
    where: and(eq(results.schoolId, tenant.schoolId), eq(results.examId, examId)),
    orderBy: [desc(results.createdAt)],
  });
}

type ListResultsForExamOptions = {
  limit?: number;
  cursor?: string;
};

type CreateModuleHistoryInput = {
  moduleSlug: string;
  moduleTitle: string;
  inputData: unknown;
  outputData: unknown;
};

export async function listResultsForExamPaginated(
  ctx: TenantContext,
  examId: string,
  options: ListResultsForExamOptions = {},
) {
  const tenant = withTenant(ctx);
  const limit = Math.min(Math.max(options.limit ?? 25, 1), 100);
  const cursorDate = options.cursor ? new Date(options.cursor) : null;

  if (cursorDate && Number.isNaN(cursorDate.getTime())) {
    throw new Error("Invalid cursor");
  }

  const whereClause = and(
    eq(results.schoolId, tenant.schoolId),
    eq(results.examId, examId),
    cursorDate ? lt(results.createdAt, cursorDate) : undefined,
  );

  const data = await db.query.results.findMany({
    where: whereClause,
    orderBy: [desc(results.createdAt)],
    limit,
  });

  const nextCursor = data.length === limit ? data[data.length - 1]?.createdAt.toISOString() : null;

  return {
    data,
    nextCursor,
  };
}

export async function createModuleHistory(ctx: TenantContext, input: CreateModuleHistoryInput) {
  const tenant = withTenant(ctx);

  const [row] = await db
    .insert(moduleHistories)
    .values({
      schoolId: tenant.schoolId,
      moduleSlug: input.moduleSlug,
      moduleTitle: input.moduleTitle,
      inputData: input.inputData,
      outputData: input.outputData,
    })
    .returning();

  return row;
}

export async function listModuleHistory(ctx: TenantContext, moduleSlug: string, limit = 10) {
  const tenant = withTenant(ctx);
  const safeLimit = Math.min(Math.max(limit, 1), 50);

  return db.query.moduleHistories.findMany({
    where: and(eq(moduleHistories.schoolId, tenant.schoolId), eq(moduleHistories.moduleSlug, moduleSlug)),
    orderBy: [desc(moduleHistories.createdAt)],
    limit: safeLimit,
  });
}
