"use client";

import type { StudentSubjectMastery } from "@/src/lib/parent-student-portal";

type Props = {
  rows: StudentSubjectMastery[];
};

export function StrengthMeter({ rows }: Props) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-violet-500/25 bg-violet-950/30 px-5 py-8 text-center text-sm text-slate-400">
        No graded assessments yet. Scores will appear here once your teachers publish results.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <p className="text-xs text-slate-400">
        Mastery is estimated from your recent marks per subject area (same scale as exam scores, capped at 100).
      </p>
      <ul className="space-y-4">
        {rows.map((row) => (
          <li key={row.subject} className="space-y-2">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="font-medium text-slate-100">{row.subject}</span>
              <span className="tabular-nums text-violet-200">{row.masteryPercent}%</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500 transition-[width] duration-500 ease-out"
                style={{ width: `${row.masteryPercent}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
