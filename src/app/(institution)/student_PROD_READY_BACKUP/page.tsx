import Link from "next/link";
import { StrengthMeter } from "@/src/components/student/StrengthMeter";
import { requireStudentSession } from "@/src/components/student/student-access";
import { fetchStudentSubjectMastery } from "@/src/lib/parent-student-portal";
import { modulePillars } from "@/src/lib/modules";
import { isMockApiMode } from "@/src/lib/api-mode";
import { DashboardMain } from "@/src/components/ghost-mode/DashboardMain";

export const dynamic = "force-dynamic";

export default async function StudentPortalPage() {
  const mockMode = isMockApiMode();

  if (mockMode) {
    return <DashboardMain />;
  }

  const { schoolId, studentId } = await requireStudentSession();

  const mastery = studentId ? await fetchStudentSubjectMastery(schoolId, studentId) : [];

  return (
    <div className="space-y-8 pb-10">
      {studentId ? (
        <section className="space-y-4">
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
        </section>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/40 px-5 py-6 text-sm text-slate-400">
          No student record linked yet. Strength meter will appear once a student is enrolled.
        </div>
      )}

      <section className="space-y-6">
        <header className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-white">Learning modules</h2>
          <p className="max-w-2xl text-sm text-slate-400">
            AI-powered modules available for students.
          </p>
        </header>

        {modulePillars.map((pillar) => (
          <div key={pillar.id} className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-300">{pillar.title}</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {pillar.modules.map((mod) => (
                <Link
                  key={mod.slug}
                  href={`/modules/${mod.slug}`}
                  className="group rounded-xl border border-slate-800 bg-slate-900/60 p-4 transition hover:border-violet-500/40 hover:bg-slate-900"
                >
                  <p className="font-semibold text-white group-hover:text-violet-200">{mod.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{mod.description}</p>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
