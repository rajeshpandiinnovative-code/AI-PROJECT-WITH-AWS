"use server";

import { eq, and, sql, gte, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auth } from "@/auth";
import { db } from "@/src/lib/db";
import { lessonLogs, platformUsers, students } from "@/src/db/schema";

/* ─────────────────────────────────────────────────────────────────────────────
 * Session resolution helpers
 * ───────────────────────────────────────────────────────────────────────────── */

type SessionUser = {
  id?: string;
  platformUserId?: string;
  schoolId?: string;
  role?: string;
};

function resolveSessionContext(session: { user?: SessionUser } | null) {
  const user = session?.user;
  const userId = user?.platformUserId ?? user?.id;
  const schoolId = user?.schoolId;
  const role = (user?.role ?? "").toUpperCase();
  return { userId, schoolId, role };
}

function resolveTeacherIds(session: { user?: SessionUser } | null) {
  const { userId: teacherId, schoolId } = resolveSessionContext(session);
  if (!schoolId || !teacherId) {
    throw new Error("Unauthorized: teacher session with school context required");
  }
  return { teacherId, schoolId };
}

const ELEVATED_ROLES = new Set(["MANAGEMENT", "PRINCIPAL", "SUPER_ADMIN"]);

const logLessonSchema = z.object({
  studentId: z
    .string({ error: "Student ID is required" })
    .uuid("Invalid Student ID: Must be a valid UUID"),
  cbseSkillCode: z
    .string({ error: "CBSE Skill Code is required" })
    .min(1, "CBSE Skill Code cannot be empty")
    .max(64, "CBSE Skill Code must be 64 characters or fewer"),
  sessionDuration: z
    .number({ error: "Session duration must be a number" })
    .int("Session duration must be a whole number (minutes)")
    .min(1, "Invalid duration: Must be at least 1 minute")
    .max(300, "Invalid duration: Must not exceed 300 minutes (5 hours)"),
  masteryScore: z
    .number({ error: "Mastery score must be a number" })
    .min(0, "Invalid score: Must be between 0–100")
    .max(100, "Invalid score: Must be between 0–100"),
});

export type LogLessonInput = z.infer<typeof logLessonSchema>;

export type LogLessonResult =
  | { success: true; isCompliant: boolean }
  | { success: false; error: string };

const DUPLICATE_WINDOW_MS = 60_000;

export async function logLessonSession(input: LogLessonInput): Promise<LogLessonResult> {
  const result = logLessonSchema.safeParse(input);
  if (!result.success) {
    const firstError = result.error.issues[0]?.message ?? "Invalid input";
    return { success: false, error: firstError };
  }
  const parsed = result.data;

  const session = await auth();
  const { teacherId, schoolId } = resolveTeacherIds(session);

  const [student] = await db
    .select({ id: students.id, schoolId: students.schoolId })
    .from(students)
    .where(eq(students.id, parsed.studentId))
    .limit(1);

  if (!student) return { success: false, error: "Student not found" };
  if (student.schoolId !== schoolId) {
    return { success: false, error: "Access denied: Student does not belong to your institution" };
  }

  const windowStart = new Date(Date.now() - DUPLICATE_WINDOW_MS);
  const [duplicate] = await db
    .select({ id: lessonLogs.id })
    .from(lessonLogs)
    .where(
      and(
        eq(lessonLogs.teacherId, teacherId),
        eq(lessonLogs.studentId, parsed.studentId),
        eq(lessonLogs.cbseSkillCode, parsed.cbseSkillCode),
        eq(lessonLogs.schoolId, schoolId),
        gte(lessonLogs.createdAt, windowStart),
      ),
    )
    .limit(1);

  if (duplicate) {
    return {
      success: false,
      error: "Duplicate session detected: This student + skill combination was already logged within the last minute. Please wait before logging again.",
    };
  }

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

/**
 * Fetch compliance summary for a given teacher+school.
 * Accepts explicit IDs so the caller (a Server Component that already has the session)
 * doesn't force a second `auth()` round-trip.
 */
export async function getComplianceSummary(teacherId: string, schoolId: string): Promise<ComplianceSummary> {
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

/* ─────────────────────────────────────────────────────────────────────────────
 * School-level compliance metrics — for Principals / Management / CEO view
 * ───────────────────────────────────────────────────────────────────────────── */

export type TopTeacher = {
  teacherId: string;
  displayName: string;
  totalMinutes: number;
  totalHours: number;
  percentToMandate: number;
  compliantSessions: number;
  totalSessions: number;
};

export type SchoolComplianceMetrics = {
  totalSchoolMinutes: number;
  totalSchoolHours: number;
  totalSessions: number;
  overallReadinessScore: number;
  topTeachers: TopTeacher[];
};

const MANDATE_HOURS = 20;

export async function getSchoolComplianceMetrics(schoolId: string): Promise<SchoolComplianceMetrics> {
  const [schoolAgg] = await db
    .select({
      totalMinutes: sql<number>`coalesce(sum(${lessonLogs.sessionDuration}), 0)`,
      totalSessions: sql<number>`count(*)`,
      avgMastery: sql<number>`coalesce(avg(${lessonLogs.masteryScore}), 0)`,
    })
    .from(lessonLogs)
    .where(eq(lessonLogs.schoolId, schoolId));

  const totalSchoolMinutes = Number(schoolAgg.totalMinutes) || 0;
  const totalSchoolHours = totalSchoolMinutes / 60;

  const teacherRows = await db
    .select({
      teacherId: lessonLogs.teacherId,
      displayName: platformUsers.displayName,
      email: platformUsers.email,
      totalMinutes: sql<number>`coalesce(sum(${lessonLogs.sessionDuration}), 0)`,
      compliantSessions: sql<number>`coalesce(sum(case when ${lessonLogs.isCompliant} then 1 else 0 end), 0)`,
      totalSessions: sql<number>`count(*)`,
    })
    .from(lessonLogs)
    .leftJoin(platformUsers, eq(lessonLogs.teacherId, platformUsers.id))
    .where(eq(lessonLogs.schoolId, schoolId))
    .groupBy(lessonLogs.teacherId, platformUsers.displayName, platformUsers.email)
    .orderBy(desc(sql`sum(${lessonLogs.sessionDuration})`))
    .limit(3);

  const topTeachers: TopTeacher[] = teacherRows.map((r) => {
    const mins = Number(r.totalMinutes) || 0;
    const hrs = mins / 60;
    const name = (r.displayName ?? "").trim();
    return {
      teacherId: r.teacherId,
      displayName: name || r.email || "N/A",
      totalMinutes: mins,
      totalHours: Math.round(hrs * 10) / 10,
      percentToMandate: MANDATE_HOURS > 0 ? Math.min(100, Math.round((hrs / MANDATE_HOURS) * 100)) : 0,
      compliantSessions: Number(r.compliantSessions) || 0,
      totalSessions: Number(r.totalSessions) || 0,
    };
  });

  const totalSess = Number(schoolAgg.totalSessions) || 0;
  const avgMastery = Number(schoolAgg.avgMastery) || 0;

  return {
    totalSchoolMinutes,
    totalSchoolHours: Math.round(totalSchoolHours * 10) / 10,
    totalSessions: totalSess,
    overallReadinessScore: totalSess > 0 ? Math.round(avgMastery * 10) / 10 : 0,
    topTeachers,
  };
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Teacher-level drill-down — role-gated access for Principal / Management
 * ───────────────────────────────────────────────────────────────────────────── */

export type TeacherDetailResult =
  | { success: true; data: ComplianceSummary & { displayName: string } }
  | { success: false; error: string };

/**
 * Fetch an individual teacher's compliance detail.
 *
 * Security model:
 * - TEACHER role can only view their own data (targetUserId must match session).
 * - PRINCIPAL / MANAGEMENT / SUPER_ADMIN can view any teacher within their school.
 */
export async function getTeacherComplianceDetail(targetUserId: string): Promise<TeacherDetailResult> {
  const session = await auth();
  const { userId, schoolId, role } = resolveSessionContext(session);

  if (!userId || !schoolId) {
    return { success: false, error: "Unauthorized: Valid session required" };
  }

  if (!ELEVATED_ROLES.has(role) && userId !== targetUserId) {
    return { success: false, error: "Access denied: Administrative clearance required to view other teachers" };
  }

  const [targetUser] = await db
    .select({ id: platformUsers.id, schoolId: platformUsers.schoolId, displayName: platformUsers.displayName, email: platformUsers.email })
    .from(platformUsers)
    .where(eq(platformUsers.id, targetUserId))
    .limit(1);

  if (!targetUser) {
    return { success: false, error: "Teacher not found" };
  }

  if (targetUser.schoolId !== schoolId) {
    return { success: false, error: "Access denied: Teacher does not belong to your institution" };
  }

  const [row] = await db
    .select({
      totalMinutes: sql<number>`coalesce(sum(${lessonLogs.sessionDuration}), 0)`,
      compliantSessions: sql<number>`coalesce(sum(case when ${lessonLogs.isCompliant} then 1 else 0 end), 0)`,
      totalSessions: sql<number>`count(*)`,
    })
    .from(lessonLogs)
    .where(and(eq(lessonLogs.teacherId, targetUserId), eq(lessonLogs.schoolId, schoolId)));

  const totalMinutes = Number(row?.totalMinutes) || 0;
  const totalHours = totalMinutes / 60;
  const mandateHours = MANDATE_HOURS;
  const total = Number(row?.totalSessions) || 0;
  const compliant = Number(row?.compliantSessions) || 0;

  const displayName = (targetUser.displayName ?? "").trim() || targetUser.email || "N/A";

  return {
    success: true,
    data: {
      displayName,
      totalMinutes,
      totalHours: Math.round(totalHours * 10) / 10,
      mandateHours,
      percentComplete: mandateHours > 0 ? Math.min(100, Math.round((totalHours / mandateHours) * 100)) : 0,
      compliantSessions: compliant,
      totalSessions: total,
      readinessScore: total > 0 ? Math.round((compliant / total) * 100) : 0,
    },
  };
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Standard-wise (Grade-wise) Performance — Principal / Management view
 * ───────────────────────────────────────────────────────────────────────────── */

export type StandardPerformance = {
  standard: string;
  totalMinutes: number;
  totalHours: number;
  mandateProgressPercent: number;
  avgMasteryScore: number;
  totalSessions: number;
  teachers: { teacherId: string; displayName: string; totalHours: number }[];
};

export type StandardWiseResult =
  | { success: true; data: StandardPerformance[] }
  | { success: false; error: string };

/**
 * Aggregate lesson logs by standard (grade level), derived from the cbseSkillCode field.
 * Skill codes follow the pattern: CBSE-SUBJECT-GRADE.TOPIC (e.g. CBSE-MATH-6.1 → Std 6).
 *
 * Security: Only PRINCIPAL, MANAGEMENT, or SUPER_ADMIN may call this.
 */
export async function getStandardWisePerformance(schoolId: string): Promise<StandardWiseResult> {
  const session = await auth();
  const { role } = resolveSessionContext(session);

  if (!ELEVATED_ROLES.has(role)) {
    return { success: false, error: "Access denied: Administrative clearance required" };
  }

  const rows = await db
    .select({
      cbseSkillCode: lessonLogs.cbseSkillCode,
      teacherId: lessonLogs.teacherId,
      teacherName: platformUsers.displayName,
      teacherEmail: platformUsers.email,
      sessionDuration: lessonLogs.sessionDuration,
      masteryScore: lessonLogs.masteryScore,
    })
    .from(lessonLogs)
    .leftJoin(platformUsers, eq(lessonLogs.teacherId, platformUsers.id))
    .where(eq(lessonLogs.schoolId, schoolId));

  if (rows.length === 0) {
    return { success: true, data: [] };
  }

  const standardMap = new Map<string, {
    totalMinutes: number;
    totalMastery: number;
    totalSessions: number;
    teacherMap: Map<string, { displayName: string; totalMinutes: number }>;
  }>();

  for (const row of rows) {
    const grade = extractGradeFromSkillCode(row.cbseSkillCode);
    const std = grade ? `Std ${grade}` : "Ungraded";

    if (!standardMap.has(std)) {
      standardMap.set(std, { totalMinutes: 0, totalMastery: 0, totalSessions: 0, teacherMap: new Map() });
    }
    const entry = standardMap.get(std)!;
    entry.totalMinutes += Number(row.sessionDuration) || 0;
    entry.totalMastery += Number(row.masteryScore) || 0;
    entry.totalSessions += 1;

    const tid = row.teacherId;
    if (!entry.teacherMap.has(tid)) {
      const name = ((row.teacherName ?? "").trim()) || row.teacherEmail || "N/A";
      entry.teacherMap.set(tid, { displayName: name, totalMinutes: 0 });
    }
    entry.teacherMap.get(tid)!.totalMinutes += Number(row.sessionDuration) || 0;
  }

  const data: StandardPerformance[] = Array.from(standardMap.entries())
    .sort((a, b) => {
      const numA = parseInt(a[0].replace(/\D/g, "")) || 99;
      const numB = parseInt(b[0].replace(/\D/g, "")) || 99;
      return numA - numB;
    })
    .map(([std, entry]) => {
      const hrs = entry.totalMinutes / 60;
      return {
        standard: std,
        totalMinutes: entry.totalMinutes,
        totalHours: Math.round(hrs * 10) / 10,
        mandateProgressPercent: MANDATE_HOURS > 0 ? Math.min(100, Math.round((hrs / MANDATE_HOURS) * 100)) : 0,
        avgMasteryScore: entry.totalSessions > 0 ? Math.round((entry.totalMastery / entry.totalSessions) * 10) / 10 : 0,
        totalSessions: entry.totalSessions,
        teachers: Array.from(entry.teacherMap.entries()).map(([tid, t]) => ({
          teacherId: tid,
          displayName: t.displayName,
          totalHours: Math.round((t.totalMinutes / 60) * 10) / 10,
        })),
      };
    });

  return { success: true, data };
}

function extractGradeFromSkillCode(code: string): string | null {
  const match = code.match(/\b(\d{1,2})\./);
  if (match) return match[1];
  const trailingMatch = code.match(/-(\d{1,2})$/);
  if (trailingMatch) return trailingMatch[1];
  return null;
}
