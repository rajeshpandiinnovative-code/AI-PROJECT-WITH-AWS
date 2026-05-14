import { PaperUpload } from "@/src/components/teacher/PaperUpload";
import { ComplianceProgress } from "@/src/components/teacher/ComplianceProgress";
import { requireTeacherSession } from "@/src/components/teacher/teacher-access";
import { listExams, listStudents } from "@/src/db/queries";
import { getComplianceSummary } from "@/src/app/actions/compliance";

export const dynamic = "force-dynamic";

export default async function TeacherDashboardPage() {
  const { tenantId } = await requireTeacherSession();
  const [studentRows, examRows, complianceSummary] = await Promise.all([
    listStudents(tenantId),
    listExams(tenantId),
    getComplianceSummary(),
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
      <ComplianceProgress summary={complianceSummary} />
      <PaperUpload students={students} exams={exams} />
    </div>
  );
}
