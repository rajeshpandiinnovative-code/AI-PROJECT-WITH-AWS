import { eq } from "drizzle-orm";
import { PaperUpload } from "@/src/components/teacher/PaperUpload";
import { ComplianceProgress } from "@/src/components/teacher/ComplianceProgress";
import { requireTeacherSession } from "@/src/components/teacher/teacher-access";
import { listExams, listStudents } from "@/src/db/queries";
import { getComplianceSummary } from "@/src/app/actions/compliance";
import { schools } from "@/src/db/schema";
import { db } from "@/src/lib/db";

export const dynamic = "force-dynamic";

export default async function TeacherDashboardPage() {
  const { session, tenantId } = await requireTeacherSession();
  const teacherId = session.user.platformUserId ?? session.user.id ?? "";
  const [studentRows, examRows, complianceSummary, schoolRow] = await Promise.all([
    listStudents(tenantId),
    listExams(tenantId),
    getComplianceSummary(teacherId, tenantId),
    db.query.schools.findFirst({ where: eq(schools.id, tenantId), columns: { name: true } }),
  ]);
  const students = studentRows.map((s) => ({ id: s.id, name: s.name, rollNo: s.rollNo }));
  const exams = examRows.map((e) => ({
    id: e.id,
    name: e.name,
    dateLabel: e.date
      ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(e.date))
      : "—",
  }));

  return (
    <div className="space-y-8 pb-10">
      <header className="space-y-2 border-b border-slate-800/80 pb-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-teal-300/90">Assessment workflow</p>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Scan student papers</h1>
        <p className="max-w-2xl text-sm text-slate-400">
          Lists below are loaded with your signed-in teacher session — same schoolId as `/api/scan-paper`.
        </p>
      </header>
      <ComplianceProgress
        summary={complianceSummary}
        students={students.map((s) => ({ id: s.id, name: s.name }))}
        schoolName={schoolRow?.name}
      />
      <PaperUpload students={students} exams={exams} />
    </div>
  );
}
