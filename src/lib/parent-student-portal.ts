import { and, desc, eq, inArray } from "drizzle-orm";

import {
  exams,
  interventionTasks,
  parentStudentLinks,
  results,
  students,
} from "@/src/db/schema";
import { subjectBucketLabelFromExamName } from "@/src/db/queries";
import { db } from "@/src/lib/db";
import { requireStrictTenantSchoolId } from "@/src/db/tenant-context";

export type ParentLatestScoreRow = {
  studentId: string;
  studentName: string;
  examName: string;
  examDateLabel: string;
  marks: number;
};

export type ParentImprovementRow = {
  studentId: string;
  studentName: string;
  examName: string;
  marks: number;
  recommendedModule: string;
};

/**
 * Parent dashboard: latest exam score per linked child, scoped by `parent_student_links` + school.
 */
export async function fetchParentDashboard(
  parentPlatformUserId: string,
  schoolId: string,
): Promise<{ latestScores: ParentLatestScoreRow[]; improvements: ParentImprovementRow[] }> {
  const sid = requireStrictTenantSchoolId(schoolId);

  const links = await db.query.parentStudentLinks.findMany({
    where: and(
      eq(parentStudentLinks.parentPlatformUserId, parentPlatformUserId),
      eq(parentStudentLinks.schoolId, sid),
    ),
    columns: { studentId: true },
  });

  const studentIds = links.map((l) => l.studentId);
  if (studentIds.length === 0) {
    return { latestScores: [], improvements: [] };
  }

  const scoreRows = await db
    .select({
      studentId: results.studentId,
      marks: results.marks,
      examName: exams.name,
      examDate: exams.date,
      studentName: students.name,
      createdAt: results.createdAt,
    })
    .from(results)
    .innerJoin(exams, eq(results.examId, exams.id))
    .innerJoin(students, eq(results.studentId, students.id))
    .where(
      and(
        eq(results.schoolId, sid),
        eq(exams.schoolId, sid),
        eq(students.schoolId, sid),
        inArray(results.studentId, studentIds),
      ),
    )
    .orderBy(desc(exams.date), desc(results.createdAt));

  const bestByStudent = new Map<string, (typeof scoreRows)[number]>();
  for (const row of scoreRows) {
    if (!bestByStudent.has(row.studentId)) {
      bestByStudent.set(row.studentId, row);
    }
  }

  const latestScores: ParentLatestScoreRow[] = studentIds
    .map((id) => {
      const row = bestByStudent.get(id);
      if (!row) return null;
      const examDateLabel = row.examDate
        ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(row.examDate))
        : "—";
      return {
        studentId: row.studentId,
        studentName: row.studentName,
        examName: row.examName,
        examDateLabel,
        marks: row.marks,
      };
    })
    .filter((x): x is ParentLatestScoreRow => x !== null);

  const improvementsRaw = await db
    .select({
      studentId: results.studentId,
      studentName: students.name,
      examName: interventionTasks.examName,
      marks: interventionTasks.marks,
      recommendedModule: interventionTasks.recommendedModule,
    })
    .from(interventionTasks)
    .innerJoin(results, eq(interventionTasks.sourceResultId, results.id))
    .innerJoin(students, eq(results.studentId, students.id))
    .innerJoin(
      parentStudentLinks,
      and(
        eq(parentStudentLinks.studentId, results.studentId),
        eq(parentStudentLinks.parentPlatformUserId, parentPlatformUserId),
        eq(parentStudentLinks.schoolId, sid),
      ),
    )
    .where(
      and(
        eq(interventionTasks.schoolId, sid),
        eq(results.schoolId, sid),
        eq(students.schoolId, sid),
        eq(interventionTasks.status, "assigned"),
      ),
    )
    .orderBy(desc(interventionTasks.createdAt));

  const improvements: ParentImprovementRow[] = improvementsRaw.map((r) => ({
    studentId: r.studentId,
    studentName: r.studentName,
    examName: r.examName,
    marks: r.marks,
    recommendedModule: r.recommendedModule,
  }));

  return { latestScores, improvements };
}

export type StudentSubjectMastery = { subject: string; masteryPercent: number };

/**
 * Student portal: average marks per subject bucket as a 0–100 mastery proxy (same school + student only).
 */
export async function fetchStudentSubjectMastery(
  schoolId: string,
  studentId: string,
): Promise<StudentSubjectMastery[]> {
  const sid = requireStrictTenantSchoolId(schoolId);

  const rows = await db
    .select({
      marks: results.marks,
      examName: exams.name,
    })
    .from(results)
    .innerJoin(exams, eq(results.examId, exams.id))
    .where(and(eq(results.schoolId, sid), eq(exams.schoolId, sid), eq(results.studentId, studentId)));

  const buckets = new Map<string, { sum: number; n: number }>();
  for (const row of rows) {
    const subject = subjectBucketLabelFromExamName(row.examName);
    const cur = buckets.get(subject) ?? { sum: 0, n: 0 };
    cur.sum += row.marks;
    cur.n += 1;
    buckets.set(subject, cur);
  }

  return [...buckets.entries()]
    .map(([subject, { sum, n }]) => ({
      subject,
      masteryPercent: n > 0 ? Math.min(100, Math.max(0, Math.round(sum / n))) : 0,
    }))
    .sort((a, b) => a.subject.localeCompare(b.subject));
}
