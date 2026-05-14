"use client";

import { useCallback, useState, useTransition } from "react";
import {
  BarChart3,
  ChevronDown,
  ChevronRight,
  Loader2,
  ShieldCheck,
  User,
} from "lucide-react";
import type { StandardPerformance } from "@/src/app/actions/compliance";
import { getStandardWisePerformance } from "@/src/app/actions/compliance";

export function StandardPerformanceChart({
  schoolId,
  initialData,
}: {
  schoolId: string;
  initialData?: StandardPerformance[] | null;
}) {
  const [data, setData] = useState<StandardPerformance[] | null>(initialData ?? null);
  const [loading, startLoad] = useTransition();
  const [expandedStd, setExpandedStd] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(() => {
    startLoad(async () => {
      const result = await getStandardWisePerformance(schoolId);
      if (result.success) {
        setData(result.data);
        setError(null);
      } else {
        setError(result.error);
      }
    });
  }, [schoolId]);

  const toggleExpand = useCallback((std: string) => {
    setExpandedStd((prev) => (prev === std ? null : std));
  }, []);

  if (!data && !loading && !error) {
    return (
      <section className="rounded-2xl border border-slate-800/80 bg-gradient-to-br from-slate-900/90 to-slate-950 p-6 shadow-xl shadow-black/20 font-sans">
        <div className="flex items-center gap-2">
          <BarChart3 className="size-5 text-indigo-400" aria-hidden />
          <h3 className="text-sm font-semibold uppercase tracking-wide text-indigo-200">
            Standard-wise Performance
          </h3>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Grade-level breakdown of mandate progress and mastery scores
        </p>
        <button
          type="button"
          onClick={loadData}
          className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow transition hover:bg-indigo-500"
        >
          Load Performance Data
        </button>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-800/80 bg-gradient-to-br from-slate-900/90 to-slate-950 shadow-xl shadow-black/20 font-sans">
      <div className="border-b border-slate-800/80 px-6 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="size-5 text-indigo-400" aria-hidden />
            <h3 className="text-sm font-semibold uppercase tracking-wide text-indigo-200">
              Standard-wise Performance
            </h3>
          </div>
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-indigo-500/40 hover:text-white disabled:opacity-50"
          >
            {loading ? <Loader2 className="size-3.5 animate-spin" /> : <BarChart3 className="size-3.5" />}
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Grade-level mandate progress and average mastery — click a standard to view assigned teachers
        </p>
      </div>

      {error && (
        <div className="px-6 py-4">
          <p className="rounded-lg border border-red-500/30 bg-red-950/30 px-4 py-2 text-xs text-red-200">
            {error}
          </p>
        </div>
      )}

      {loading && !data && (
        <div className="flex items-center justify-center gap-2 px-6 py-10">
          <Loader2 className="size-5 animate-spin text-indigo-400" />
          <span className="text-sm text-slate-400">Loading standard-wise data…</span>
        </div>
      )}

      {data && data.length === 0 && (
        <div className="px-6 py-10 text-center">
          <p className="text-sm text-slate-500">
            No data recorded yet. Performance metrics will appear once teachers log sessions with CBSE skill codes.
          </p>
        </div>
      )}

      {data && data.length > 0 && (
        <div className="divide-y divide-slate-800/60">
          {data.map((std) => (
            <div key={std.standard}>
              <button
                type="button"
                onClick={() => toggleExpand(std.standard)}
                className="flex w-full items-center gap-4 px-6 py-4 text-left transition hover:bg-slate-900/50"
              >
                {expandedStd === std.standard ? (
                  <ChevronDown className="size-4 shrink-0 text-indigo-400" />
                ) : (
                  <ChevronRight className="size-4 shrink-0 text-slate-500" />
                )}

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-white">{std.standard}</span>
                    <span className="text-xs text-slate-400">{std.totalSessions} sessions</span>
                  </div>

                  <div className="mt-2 grid gap-3 sm:grid-cols-2">
                    {/* Mandate Progress */}
                    <div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Mandate Progress</span>
                        <span className={`font-semibold ${std.mandateProgressPercent >= 100 ? "text-emerald-400" : std.mandateProgressPercent >= 50 ? "text-amber-400" : "text-red-400"}`}>
                          {std.mandateProgressPercent}%
                        </span>
                      </div>
                      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-800">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            std.mandateProgressPercent >= 100
                              ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                              : std.mandateProgressPercent >= 50
                                ? "bg-gradient-to-r from-amber-500 to-teal-400"
                                : "bg-gradient-to-r from-red-500 to-amber-500"
                          }`}
                          style={{ width: `${Math.min(std.mandateProgressPercent, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Mastery Score */}
                    <div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Average Mastery Score</span>
                        <span className={`font-semibold ${std.avgMasteryScore >= 70 ? "text-emerald-400" : std.avgMasteryScore >= 50 ? "text-amber-400" : "text-red-400"}`}>
                          {std.avgMasteryScore}%
                        </span>
                      </div>
                      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-800">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            std.avgMasteryScore >= 70
                              ? "bg-gradient-to-r from-emerald-500 to-emerald-400"
                              : std.avgMasteryScore >= 50
                                ? "bg-gradient-to-r from-amber-500 to-amber-400"
                                : "bg-gradient-to-r from-red-500 to-red-400"
                          }`}
                          style={{ width: `${Math.min(std.avgMasteryScore, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </button>

              {/* Drill-down: Teachers for this standard */}
              {expandedStd === std.standard && (
                <div className="border-t border-slate-800/40 bg-slate-950/50 px-6 py-3">
                  <div className="flex items-center gap-2 pb-2">
                    <ShieldCheck className="size-3.5 text-teal-400" aria-hidden />
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-teal-300">
                      Teachers assigned to {std.standard}
                    </span>
                  </div>
                  {std.teachers.length === 0 ? (
                    <p className="py-2 text-xs text-slate-500">No teacher data available for this standard.</p>
                  ) : (
                    <div className="divide-y divide-slate-800/40">
                      {std.teachers.map((t) => (
                        <div key={t.teacherId} className="flex items-center justify-between py-2">
                          <div className="flex items-center gap-2">
                            <User className="size-3.5 text-slate-500" aria-hidden />
                            <span className="text-xs font-medium text-slate-200">{t.displayName}</span>
                          </div>
                          <span className="text-xs tabular-nums text-slate-400">{t.totalHours}h logged</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
