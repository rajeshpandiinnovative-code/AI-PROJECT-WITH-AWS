import { requireParentSession } from "@/src/components/parent/parent-access";
import { fetchParentDashboard } from "@/src/lib/parent-student-portal";

export const dynamic = "force-dynamic";

export default async function ParentDashboardPage() {
  const { parentPlatformUserId, schoolId } = await requireParentSession();
  const { latestScores, improvements } = await fetchParentDashboard(parentPlatformUserId, schoolId);

  return (
    <div className="space-y-10 pb-10">
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Latest scores</h2>
        <p className="max-w-2xl text-sm text-slate-400">
          Pulled from results for children linked to your account at this school. If a child is missing, your school
          needs to connect their student record to your parent profile.
        </p>
        {latestScores.length === 0 ? (
          <p className="rounded-lg border border-slate-800 bg-slate-900/50 px-4 py-6 text-sm text-slate-400">
            No scores yet, or no students linked to your parent account for this school.
          </p>
        ) : (
          <ul className="divide-y divide-slate-800 overflow-hidden rounded-xl border border-slate-800 bg-slate-900/40">
            {latestScores.map((row) => (
              <li key={row.studentId} className="flex flex-col gap-1 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium text-slate-100">{row.studentName}</p>
                  <p className="text-sm text-slate-500">
                    {row.examName}
                    <span className="text-slate-600"> · </span>
                    {row.examDateLabel}
                  </p>
                </div>
                <p className="text-lg font-semibold tabular-nums text-rose-200">{row.marks}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Areas for improvement</h2>
        <p className="max-w-2xl text-sm text-slate-400">
          Open interventions at this school for your linked students (assigned remediations from low scores).
        </p>
        {improvements.length === 0 ? (
          <p className="rounded-lg border border-slate-800 bg-slate-900/50 px-4 py-6 text-sm text-slate-400">
            No active improvement tasks for your linked students.
          </p>
        ) : (
          <ul className="divide-y divide-slate-800 overflow-hidden rounded-xl border border-slate-800 bg-slate-900/40">
            {improvements.map((row, idx) => (
              <li key={`${row.studentId}-${row.examName}-${row.recommendedModule}-${idx}`} className="px-4 py-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-medium text-slate-100">{row.studentName}</p>
                    <p className="text-sm text-slate-500">{row.examName}</p>
                  </div>
                  <p className="text-sm tabular-nums text-slate-400">Marks: {row.marks}</p>
                </div>
                <p className="mt-2 text-sm text-amber-200/90">
                  Focus area: <span className="font-mono text-xs text-amber-100/90">{row.recommendedModule}</span>
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
