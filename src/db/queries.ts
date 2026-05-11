import { and, count, desc, eq, isNotNull, lt, sql } from "drizzle-orm";

import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

import { db } from "./client";
import { exams, interventionTasks, moduleHistories, results, schools, students } from "./schema";
import type * as schema from "./schema";
import { requireStrictTenantSchoolId } from "./tenant-context";

type DbLike = PostgresJsDatabase<typeof schema>;

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

/** Map exam title to a remediation module slug for intervention tasks. */
export function recommendedModuleForExamName(examName: string): string {
  const n = examName.toLowerCase();
  if (/math|mathematics|algebra|calculus|geometry|arithm|numeracy|quant/.test(n)) {
    return "numeracy-fix-module";
  }
  if (/science|physics|chemistry|biology|botany|zoology/.test(n)) {
    return "weak-area-detection";
  }
  if (/english|grammar|language|literature|writing|essay/.test(n)) {
    return "ai-notes-generator";
  }
  if (/computer|coding|program|python|java/.test(n)) {
    return "coding-for-kids";
  }
  if (/social|history|civics|geography|economics/.test(n)) {
    return "ai-study-planner";
  }
  return "weak-area-detection";
}

async function upsertInterventionTasksForFailingMarks(dbOrTx: DbLike, examId: string, sid: string): Promise<void> {
  const failingRows = await dbOrTx
    .select({
      resultId: results.id,
      marks: results.marks,
      studentName: students.name,
      examName: exams.name,
    })
    .from(results)
    .innerJoin(students, eq(results.studentId, students.id))
    .innerJoin(exams, eq(results.examId, exams.id))
    .where(
      and(
        eq(results.examId, examId),
        eq(results.schoolId, sid),
        eq(students.schoolId, sid),
        eq(exams.schoolId, sid),
        lt(results.marks, 40),
      ),
    );

  const now = new Date();
  for (const row of failingRows) {
    const recommendedModule = recommendedModuleForExamName(row.examName);
    await dbOrTx
      .insert(interventionTasks)
      .values({
        schoolId: sid,
        sourceResultId: row.resultId,
        studentName: row.studentName,
        examName: row.examName,
        marks: row.marks,
        recommendedModule,
        status: "assigned",
      })
      .onConflictDoUpdate({
        target: [interventionTasks.schoolId, interventionTasks.sourceResultId],
        set: {
          studentName: row.studentName,
          examName: row.examName,
          marks: row.marks,
          recommendedModule,
          status: "assigned",
          updatedAt: now,
        },
      });
  }
}

/**
 * Creates or refreshes intervention tasks for every failing mark (&lt; 40) on this exam.
 * Idempotent per (schoolId, sourceResultId) via unique index + onConflictDoUpdate.
 */
export async function syncInterventionTasks(examId: string, schoolId: string): Promise<{ upserted: number }> {
  const sid = requireStrictTenantSchoolId(schoolId);

  const failingRows = await db
    .select({ resultId: results.id })
    .from(results)
    .innerJoin(students, eq(results.studentId, students.id))
    .innerJoin(exams, eq(results.examId, exams.id))
    .where(
      and(
        eq(results.examId, examId),
        eq(results.schoolId, sid),
        eq(students.schoolId, sid),
        eq(exams.schoolId, sid),
        lt(results.marks, 40),
      ),
    );

  await upsertInterventionTasksForFailingMarks(db, examId, sid);
  return { upserted: failingRows.length };
}

export async function createStudent(schoolId: string, input: CreateStudentInput) {
  const sid = requireStrictTenantSchoolId(schoolId);

  const [student] = await db
    .insert(students)
    .values({
      schoolId: sid,
      name: input.name,
      rollNo: input.rollNo,
    })
    .returning();

  return student;
}

export async function listStudents(schoolId: string) {
  const sid = requireStrictTenantSchoolId(schoolId);

  return db.query.students.findMany({
    where: eq(students.schoolId, sid),
    orderBy: [students.rollNo],
  });
}

export async function createExam(schoolId: string, input: CreateExamInput) {
  const sid = requireStrictTenantSchoolId(schoolId);

  const [exam] = await db
    .insert(exams)
    .values({
      schoolId: sid,
      name: input.name,
      date: input.date,
    })
    .returning();

  return exam;
}

export async function listExams(schoolId: string) {
  const sid = requireStrictTenantSchoolId(schoolId);

  return db.query.exams.findMany({
    where: eq(exams.schoolId, sid),
    orderBy: [desc(exams.date)],
  });
}

export async function recordResult(schoolId: string, input: RecordResultInput) {
  const sid = requireStrictTenantSchoolId(schoolId);

  return db.transaction(async (tx) => {
    const [student] = await tx
      .select({ id: students.id })
      .from(students)
      .where(and(eq(students.id, input.studentId), eq(students.schoolId, sid)))
      .limit(1);

    const [exam] = await tx
      .select({ id: exams.id })
      .from(exams)
      .where(and(eq(exams.id, input.examId), eq(exams.schoolId, sid)))
      .limit(1);

    if (!student || !exam) {
      throw new Error("Student or exam not found in this school");
    }

    const [inserted] = await tx
      .insert(results)
      .values({
        schoolId: sid,
        studentId: input.studentId,
        examId: input.examId,
        marks: input.marks,
      })
      .returning();

    await upsertInterventionTasksForFailingMarks(tx, input.examId, sid);

    return inserted;
  });
}

export async function listResultsForExam(schoolId: string, examId: string) {
  const sid = requireStrictTenantSchoolId(schoolId);

  return db.query.results.findMany({
    where: and(eq(results.schoolId, sid), eq(results.examId, examId)),
    orderBy: [desc(results.createdAt)],
  });
}

export async function listResultsForExamPaginated(
  schoolId: string,
  examId: string,
  options: ListResultsForExamOptions = {},
) {
  const sid = requireStrictTenantSchoolId(schoolId);
  const limit = Math.min(Math.max(options.limit ?? 25, 1), 100);
  const cursorDate = options.cursor ? new Date(options.cursor) : null;

  if (cursorDate && Number.isNaN(cursorDate.getTime())) {
    throw new Error("Invalid cursor");
  }

  const whereClause = and(
    eq(results.schoolId, sid),
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

export async function createModuleHistory(schoolId: string, input: CreateModuleHistoryInput) {
  const sid = requireStrictTenantSchoolId(schoolId);

  const [row] = await db
    .insert(moduleHistories)
    .values({
      schoolId: sid,
      moduleSlug: input.moduleSlug,
      moduleTitle: input.moduleTitle,
      inputData: input.inputData,
      outputData: input.outputData,
    })
    .returning();

  return row;
}

export async function listModuleHistory(schoolId: string, moduleSlug: string, limit = 10) {
  const sid = requireStrictTenantSchoolId(schoolId);
  const safeLimit = Math.min(Math.max(limit, 1), 50);

  return db.query.moduleHistories.findMany({
    where: and(eq(moduleHistories.schoolId, sid), eq(moduleHistories.moduleSlug, moduleSlug)),
    orderBy: [desc(moduleHistories.createdAt)],
    limit: safeLimit,
  });
}

export async function countStudentsForSchool(schoolId: string): Promise<number> {
  const sid = requireStrictTenantSchoolId(schoolId);
  const [row] = await db.select({ n: count() }).from(students).where(eq(students.schoolId, sid));
  return Number(row?.n ?? 0);
}

export async function countAssignedInterventionsForSchool(schoolId: string): Promise<number> {
  const sid = requireStrictTenantSchoolId(schoolId);
  const [row] = await db
    .select({ n: count() })
    .from(interventionTasks)
    .where(and(eq(interventionTasks.schoolId, sid), eq(interventionTasks.status, "assigned")));
  return Number(row?.n ?? 0);
}

export type SchoolBillingSnapshot = {
  subscriptionStatus: string;
  subscriptionTrialEndsAt: Date | null;
  subscriptionCurrentPeriodEnd: Date | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
};

export async function getSchoolBillingSnapshot(schoolId: string): Promise<SchoolBillingSnapshot | null> {
  const sid = requireStrictTenantSchoolId(schoolId);
  const row = await db.query.schools.findFirst({
    where: eq(schools.id, sid),
    columns: {
      subscriptionStatus: true,
      subscriptionTrialEndsAt: true,
      subscriptionCurrentPeriodEnd: true,
      stripeCustomerId: true,
      stripeSubscriptionId: true,
    },
  });
  return row ?? null;
}

/** Latest intervention tasks for the tenant (e.g. management “priority” queue). */
export async function listPriorityInterventionTasks(schoolId: string, limit = 5) {
  const sid = requireStrictTenantSchoolId(schoolId);
  const safeLimit = Math.min(Math.max(limit, 1), 25);
  return db.query.interventionTasks.findMany({
    where: eq(interventionTasks.schoolId, sid),
    orderBy: [desc(interventionTasks.createdAt)],
    limit: safeLimit,
  });
}

/**
 * Distinct students who have at least one `assigned` intervention linked to a result row in this school.
 * Used for intervention rate vs total enrollment.
 */
export async function countDistinctStudentsWithAssignedInterventions(schoolId: string): Promise<number> {
  const sid = requireStrictTenantSchoolId(schoolId);
  const [row] = await db
    .select({
      n: sql<number>`cast(count(distinct ${results.studentId}) as int)`,
    })
    .from(interventionTasks)
    .innerJoin(results, eq(interventionTasks.sourceResultId, results.id))
    .where(
      and(
        eq(interventionTasks.schoolId, sid),
        eq(results.schoolId, sid),
        eq(interventionTasks.status, "assigned"),
        isNotNull(interventionTasks.sourceResultId),
      ),
    );
  return Number(row?.n ?? 0);
}

export type InterventionModuleCountRow = {
  recommendedModule: string;
  taskCount: number;
};

/** Counts of intervention tasks by `recommended_module` (highest first). */
export async function getTopNeededInterventionModules(
  schoolId: string,
  limit = 5,
): Promise<InterventionModuleCountRow[]> {
  const sid = requireStrictTenantSchoolId(schoolId);
  const lim = Math.min(Math.max(limit, 1), 20);
  const rows = await db.execute(
    sql`
      SELECT recommended_module AS "recommendedModule", COUNT(*)::int AS "taskCount"
      FROM intervention_tasks
      WHERE school_id = ${sid}::uuid
      GROUP BY recommended_module
      ORDER BY "taskCount" DESC
      LIMIT ${lim}
    `,
  );
  return Array.from(rows as unknown as Iterable<Record<string, unknown>>).map((r) => ({
    recommendedModule: String(r.recommendedModule ?? ""),
    taskCount: Number(r.taskCount ?? 0),
  }));
}
