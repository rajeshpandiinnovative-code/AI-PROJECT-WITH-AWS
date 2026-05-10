"use client";

import { useMemo, useState } from "react";

import { bulkCompleteOverdueInterventions, bulkFollowUpOverdueInterventions, completeIntervention } from "@/src/app/actions/interventions";

export type SerializedInterventionRow = {
  id: string;
  studentName: string;
  examName: string;
  marks: number;
  recommendedModule: string;
  status: string;
  ageDays: number;
  overdue: boolean;
  criticalDelay: boolean;
};

type FilterKey = "all" | "pending" | "completed" | "overdue" | "critical";

type InterventionTrackerSectionProps = {
  tasks: SerializedInterventionRow[];
  slaStatus: "critical" | "at-risk" | "healthy";
  slaMessage: string;
  overdueRate: number;
  criticalRate: number;
  openInterventionCount: number;
  overdueInterventionCount: number;
  criticalDelayCount: number;
  trackerExportAllHref: string;
  trackerExport30dHref: string;
  trackerExportHomeworkHref: string;
};

export function InterventionTrackerSection({
  tasks,
  slaStatus,
  slaMessage,
  overdueRate,
  criticalRate,
  openInterventionCount,
  overdueInterventionCount,
  criticalDelayCount,
  trackerExportAllHref,
  trackerExport30dHref,
  trackerExportHomeworkHref,
}: InterventionTrackerSectionProps) {
  const [filter, setFilter] = useState<FilterKey>("pending");

  const completedInViewCount = useMemo(
    () => tasks.filter((t) => t.status === "completed").length,
    [tasks],
  );

  const filteredTasks = useMemo(() => {
    switch (filter) {
      case "pending":
        return tasks.filter((t) => t.status !== "completed");
      case "completed":
        return tasks.filter((t) => t.status === "completed");
      case "overdue":
        return tasks.filter((t) => t.status !== "completed" && t.overdue);
      case "critical":
        return tasks.filter((t) => t.status !== "completed" && t.criticalDelay);
      default:
        return tasks;
    }
  }, [tasks, filter]);

  const pendingLabel =
    filter === "pending"
      ? `${openInterventionCount} pending`
      : filter === "all"
        ? `${tasks.length} shown`
        : `${filteredTasks.length} shown`;

  return (
    <section className="mt-12 rounded-2xl border border-slate-600 bg-[#1E293B] p-5 shadow-lg shadow-black/25 ring-1 ring-white/5">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-600/80 pb-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Intervention tracker</h2>
          <p className="mt-1 text-xs text-slate-400">Filter by status; pending shows assigned work still open.</p>
        </div>
        <span className="rounded-lg border border-slate-500/60 bg-slate-900/50 px-3 py-1.5 font-mono text-xs text-emerald-300">
          {pendingLabel}
        </span>
      </div>

      <div
        className={`mt-4 rounded-xl border p-4 ${
          slaStatus === "critical"
            ? "border-rose-500/40 bg-rose-950/25 ring-1 ring-rose-500/20"
            : slaStatus === "at-risk"
              ? "border-amber-500/40 bg-amber-950/25 ring-1 ring-amber-500/20"
              : "border-emerald-500/40 bg-emerald-950/25 ring-1 ring-emerald-500/20"
        }`}
      >
        <p
          className={`text-xs font-semibold uppercase tracking-wide ${
            slaStatus === "critical" ? "text-rose-300" : slaStatus === "at-risk" ? "text-amber-300" : "text-emerald-300"
          }`}
        >
          Intervention SLA {slaStatus === "critical" ? "Critical" : slaStatus === "at-risk" ? "At Risk" : "Healthy"}
        </p>
        <p className="mt-1 text-sm text-slate-200">{slaMessage}</p>
        <p className="mt-1 text-xs text-slate-400">
          Overdue rate: {overdueRate}% · Critical delay rate: {criticalRate}%
        </p>
      </div>

      <div className="mt-4 rounded-xl border border-slate-600 bg-slate-900/30 p-3">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Exports</p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <a href={trackerExportAllHref} className="text-xs font-semibold text-cyan-300 hover:text-cyan-200">
            Download tracker CSV (all)
          </a>
          <a href={trackerExport30dHref} className="text-xs font-semibold text-cyan-300 hover:text-cyan-200">
            Download tracker CSV (last 30d)
          </a>
          <a href={trackerExportHomeworkHref} className="text-xs font-semibold text-cyan-300 hover:text-cyan-200">
            Download tracker CSV (Homework Helper)
          </a>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-600 bg-slate-900/40 px-3 py-4 ring-1 ring-white/5">
          <p className="text-xs uppercase tracking-wide text-slate-500">Open · pending</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-amber-200">{openInterventionCount}</p>
        </div>
        <div className="rounded-xl border border-slate-600 bg-slate-900/40 px-3 py-4 ring-1 ring-white/5">
          <p className="text-xs uppercase tracking-wide text-slate-500">Overdue (&gt;3 days)</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-amber-300">{overdueInterventionCount}</p>
        </div>
        <div className="rounded-xl border border-slate-600 bg-slate-900/40 px-3 py-4 ring-1 ring-white/5">
          <p className="text-xs uppercase tracking-wide text-slate-500">Critical delay (&gt;7 days)</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-rose-300">{criticalDelayCount}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-amber-500/30 bg-amber-950/15 px-3 py-3 ring-1 ring-amber-500/10">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-200/90">Status · pending</p>
          <p className="mt-1 text-xl font-semibold tabular-nums text-amber-100">{openInterventionCount}</p>
          <p className="text-[11px] text-amber-200/70">Assigned, not completed</p>
        </div>
        <div className="rounded-lg border border-slate-600 bg-slate-900/50 px-3 py-3 ring-1 ring-white/5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">In this list · completed</p>
          <p className="mt-1 text-xl font-semibold tabular-nums text-emerald-300">{completedInViewCount}</p>
          <p className="text-[11px] text-slate-500">Rows loaded below (max 20)</p>
        </div>
        <div className="rounded-lg border border-amber-500/25 bg-slate-900/40 px-3 py-3 ring-1 ring-amber-500/10">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-400/90">Pending · overdue</p>
          <p className="mt-1 text-xl font-semibold tabular-nums text-amber-300">{overdueInterventionCount}</p>
          <p className="text-[11px] text-slate-500">Needs follow-up</p>
        </div>
        <div className="rounded-lg border border-rose-500/30 bg-rose-950/15 px-3 py-3 ring-1 ring-rose-500/10">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-rose-300/90">Pending · critical</p>
          <p className="mt-1 text-xl font-semibold tabular-nums text-rose-200">{criticalDelayCount}</p>
          <p className="text-[11px] text-rose-200/70">&gt;7 days open</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <form action={bulkFollowUpOverdueInterventions}>
          <button
            type="submit"
            disabled={overdueInterventionCount === 0}
            className="rounded-lg border border-cyan-500/40 bg-slate-900/40 px-3 py-2 text-xs font-semibold text-cyan-200 ring-1 ring-cyan-500/15 disabled:opacity-40"
          >
            Follow-up all overdue
          </button>
        </form>
        <form action={bulkCompleteOverdueInterventions}>
          <button
            type="submit"
            disabled={criticalDelayCount === 0}
            className="rounded-lg border border-emerald-500/40 bg-slate-900/40 px-3 py-2 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-500/15 disabled:opacity-40"
          >
            Complete critical delays
          </button>
        </form>
      </div>

      <div className="mt-5 flex flex-col gap-3 rounded-xl border border-slate-600 bg-slate-900/35 p-4 sm:flex-row sm:items-center sm:justify-between">
        <label htmlFor="intervention-filter" className="text-sm font-medium text-slate-300">
          Show tasks
        </label>
        <div className="relative min-w-[min(100%,240px)]">
          <select
            id="intervention-filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value as FilterKey)}
            className="w-full appearance-none rounded-lg border border-slate-500 bg-[#0f172a] py-2.5 pl-3 pr-10 text-sm text-white shadow-inner ring-1 ring-white/5 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          >
            <option value="pending">Pending (assigned, not done)</option>
            <option value="all">All statuses</option>
            <option value="completed">Completed only</option>
            <option value="overdue">Pending · overdue (&gt;3d)</option>
            <option value="critical">Pending · critical (&gt;7d)</option>
          </select>
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">▾</span>
        </div>
      </div>

      {tasks.length === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed border-slate-600 bg-slate-900/20 px-4 py-6 text-sm text-slate-400">
          No intervention tasks yet. Assign from the watchlist to start tracking.
        </p>
      ) : filteredTasks.length === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed border-slate-600 bg-slate-900/20 px-4 py-6 text-sm text-slate-400">
          No tasks match this filter. Try &quot;All statuses&quot; or &quot;Pending&quot;.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {filteredTasks.map((task) => (
            <li
              key={task.id}
              className="rounded-xl border border-slate-600 bg-slate-900/45 p-4 ring-1 ring-white/5 shadow-md shadow-black/20"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold text-white">{task.studentName}</p>
                <div className="flex flex-wrap items-center gap-2">
                  {task.criticalDelay ? (
                    <span className="rounded-md border border-rose-500/40 bg-rose-950/30 px-2 py-1 text-xs text-rose-300">
                      Critical Delay
                    </span>
                  ) : task.overdue ? (
                    <span className="rounded-md border border-amber-500/40 bg-amber-950/30 px-2 py-1 text-xs text-amber-300">
                      Overdue
                    </span>
                  ) : null}
                  <span
                    className={`rounded-md border px-2 py-1 text-xs ${
                      task.status === "completed"
                        ? "border-emerald-500/40 bg-emerald-950/25 text-emerald-300"
                        : "border-amber-500/40 bg-amber-950/25 text-amber-300"
                    }`}
                  >
                    {task.status === "completed" ? "Completed" : "Pending · assigned"}
                  </span>
                </div>
              </div>
              <p className="mt-1 text-xs text-slate-400">
                {task.examName} · {task.marks} marks · {task.recommendedModule}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Age: {task.ageDays} day{task.ageDays === 1 ? "" : "s"}
              </p>
              {task.status !== "completed" ? (
                <form action={completeIntervention.bind(null, task.id)} className="mt-3">
                  <button
                    type="submit"
                    className="rounded-lg border border-emerald-500/40 bg-emerald-950/20 px-3 py-1.5 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-500/20"
                  >
                    Mark Completed
                  </button>
                </form>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
