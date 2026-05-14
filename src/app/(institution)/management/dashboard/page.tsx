import Link from "next/link";

import { requireManagementSession } from "@/src/lib/management/institution-access";
import {
  countDistinctStudentsWithAssignedInterventions,
  countStudentsForSchool,
  getTopNeededInterventionModules,
  listPriorityInterventionTasks,
} from "@/src/db/queries";
import { eq } from "drizzle-orm";
import { getSchoolComplianceMetrics } from "@/src/app/actions/compliance";
import { SchoolLeaderboard } from "@/src/components/admin/SchoolLeaderboard";
import { schools } from "@/src/db/schema";
import { db } from "@/src/lib/db";

export const dynamic = "force-dynamic";

export default async function ManagementCommandCenterPage() {
  const { tenantId: schoolId } = await requireManagementSession();

  const [totalStudents, studentsWithActiveTasks, topModules, feedTasks, complianceMetrics, schoolRow] = await Promise.all([
    countStudentsForSchool(schoolId),
    countDistinctStudentsWithAssignedInterventions(schoolId),
    getTopNeededInterventionModules(schoolId, 6),
    listPriorityInterventionTasks(schoolId, 10),
    getSchoolComplianceMetrics(schoolId),
    db.query.schools.findFirst({ where: eq(schools.id, schoolId), columns: { name: true } }),
  ]);

  const interventionRatePct =
    totalStudents > 0 ? Math.round((studentsWithActiveTasks / totalStudents) * 1000) / 10 : 0;

  const topModuleLine =
    topModules[0] != null
      ? `${topModules[0].recommendedModule} (${topModules[0].taskCount})`
      : "—";

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-0 pb-10 sm:space-y-10 lg:pb-12">
      <header className="space-y-2 border-b border-slate-800/80 pb-6 sm:pb-8">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-indigo-300/90 sm:text-xs sm:tracking-[0.28em]">
          Proof of value
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
          Institution pulse
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-slate-400 sm:text-base">
          Live impact metrics for your school. Optimized for laptop and tablet demos on-site.
        </p>
      </header>

      <SchoolLeaderboard metrics={complianceMetrics} schoolName={schoolRow?.name} />

      <section
        aria-labelledby="school-overview-heading"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5"
      >
        <h2 id="school-overview-heading" className="col-span-full text-sm font-semibold text-slate-200">
          School overview
        </h2>
        <article className="flex flex-col rounded-2xl border border-slate-800/90 bg-gradient-to-br from-slate-900/90 to-slate-950 p-5 shadow-lg shadow-black/20 sm:p-6">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Total active students</p>
          <p className="mt-3 text-4xl font-bold tabular-nums tracking-tight text-white sm:text-5xl">{totalStudents}</p>
          <p className="mt-2 text-xs leading-snug text-slate-500 sm:text-sm">
            Learners enrolled under your tenant (same scope as scan-paper saves).
          </p>
        </article>

        <article className="flex flex-col rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-950/40 to-slate-950 p-5 shadow-lg shadow-black/20 sm:p-6">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-200/80">Intervention rate</p>
          <p className="mt-3 text-4xl font-bold tabular-nums tracking-tight text-amber-50 sm:text-5xl">
            {interventionRatePct}
            <span className="text-2xl font-semibold text-amber-200/90 sm:text-3xl">%</span>
          </p>
          <p className="mt-2 text-xs leading-snug text-amber-100/70 sm:text-sm">
            Share of students with at least one <span className="font-medium text-amber-100/90">assigned</span>{" "}
            intervention (from OCR-linked results).
          </p>
          <p className="mt-auto pt-4 text-[11px] text-amber-200/50">
            {studentsWithActiveTasks} of {totalStudents} students
          </p>
        </article>

        <article className="flex flex-col rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-950/35 to-slate-950 p-5 shadow-lg shadow-black/20 sm:col-span-2 lg:col-span-1 sm:p-6">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-cyan-200/80">Top needed modules</p>
          <p className="mt-3 text-lg font-semibold text-cyan-50 sm:text-xl">Lead: {topModuleLine}</p>
          <ul className="mt-4 flex flex-1 flex-col gap-2 text-sm text-cyan-100/85">
            {topModules.length === 0 ? (
              <li className="text-slate-500">No intervention history yet — run paper scans to populate.</li>
            ) : (
              topModules.map((m) => (
                <li
                  key={m.recommendedModule}
                  className="flex items-center justify-between gap-3 rounded-lg bg-slate-950/50 px-3 py-2 ring-1 ring-cyan-500/10"
                >
                  <span className="truncate font-mono text-xs text-cyan-100/90 sm:text-sm">{m.recommendedModule}</span>
                  <span className="shrink-0 tabular-nums text-xs font-semibold text-cyan-200 sm:text-sm">
                    {m.taskCount}
                  </span>
                </li>
              ))
            )}
          </ul>
        </article>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-800/90 bg-slate-900/40 shadow-xl shadow-black/25">
        <div className="flex flex-col gap-3 border-b border-slate-800/80 px-4 py-4 sm:flex-row sm:items-end sm:justify-between sm:px-6 sm:py-5">
          <div>
            <h2 className="text-lg font-semibold text-white sm:text-xl">Real-time intervention feed</h2>
            <p className="mt-1 text-xs text-slate-500 sm:text-sm">
              Last 10 tasks generated from paper scans and grading (`/api/scan-paper` → results → interventions).
            </p>
          </div>
          <Link
            href="/school/dashboard"
            className="inline-flex shrink-0 items-center justify-center rounded-lg border border-indigo-500/30 bg-indigo-950/40 px-3 py-2 text-xs font-medium text-indigo-200 transition hover:border-indigo-400/50 hover:text-white sm:text-sm"
          >
            Academic analytics →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800/80 bg-slate-950/60 text-[11px] font-semibold uppercase tracking-wide text-slate-500 sm:text-xs">
                <th className="whitespace-nowrap px-4 py-3 sm:px-6">When</th>
                <th className="whitespace-nowrap px-4 py-3 sm:px-6">Student</th>
                <th className="whitespace-nowrap px-4 py-3 sm:px-6">Exam</th>
                <th className="whitespace-nowrap px-4 py-3 text-right sm:px-6">Marks</th>
                <th className="whitespace-nowrap px-4 py-3 sm:px-6">Module</th>
                <th className="whitespace-nowrap px-4 py-3 sm:px-6">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {feedTasks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-500 sm:px-6">
                    No rows yet. Scan a paper to stream interventions here.
                  </td>
                </tr>
              ) : (
                feedTasks.map((t) => (
                  <tr key={t.id} className="bg-slate-950/20 hover:bg-slate-900/50">
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-400 sm:px-6 sm:text-sm">
                      {t.createdAt.toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="max-w-[140px] truncate px-4 py-3 font-medium text-slate-100 sm:max-w-[200px] sm:px-6">
                      {t.studentName}
                    </td>
                    <td className="max-w-[160px] truncate px-4 py-3 text-slate-300 sm:max-w-xs sm:px-6">{t.examName}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-slate-200 sm:px-6">
                      {t.marks}
                    </td>
                    <td className="max-w-[180px] truncate px-4 py-3 font-mono text-xs text-cyan-300/90 sm:px-6 sm:text-sm">
                      {t.recommendedModule}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 sm:px-6">
                      <span
                        className={`inline-flex rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-wide sm:text-[11px] ${
                          t.status === "assigned"
                            ? "bg-amber-500/15 text-amber-200 ring-1 ring-amber-400/25"
                            : "bg-slate-800 text-slate-300"
                        }`}
                      >
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <p className="border-t border-slate-800/60 px-4 py-3 text-[11px] text-slate-600 sm:px-6">
          Horizontal scroll on narrow tablets keeps columns readable without squashing typography.
        </p>
      </section>
    </div>
  );
}
