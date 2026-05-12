import { StrengthMeter } from "@/src/components/student/StrengthMeter";
import { requireStudentSession } from "@/src/components/student/student-access";
import { fetchStudentSubjectMastery } from "@/src/lib/parent-student-portal";

export const dynamic = "force-dynamic";

export default async function StudentPortalPage() {
  const { schoolId, studentId } = await requireStudentSession();
  const mastery = await fetchStudentSubjectMastery(schoolId, studentId);

  return (
    <div className="space-y-6 pb-10">
      <header className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight text-white">Strength meter</h2>
        <p className="max-w-2xl text-sm text-slate-400">
          Subject mastery reflects your average performance across assessments in each area for{" "}
          <span className="text-slate-300">this school only</span>.
        </p>
      </header>
      <div className="rounded-2xl border border-violet-500/20 bg-slate-900/50 p-6 shadow-lg shadow-violet-950/40">
        <StrengthMeter rows={mastery} />
      </div>
    </div>
  );
}
