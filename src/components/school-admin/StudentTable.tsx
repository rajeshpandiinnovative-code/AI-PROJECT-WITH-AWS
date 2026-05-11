"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

export type StudentRow = {
  id: string;
  name: string;
  rollNo: string;
  section: string | null;
  boardRegistrationNo: string | null;
};

export function StudentTable({ students }: { students: StudentRow[] }) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return students;
    return students.filter((s) => {
      const blob = [s.name, s.rollNo, s.section ?? "", s.boardRegistrationNo ?? ""].join(" ").toLowerCase();
      return blob.includes(needle);
    });
  }, [students, q]);

  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-3 py-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Student Information System</p>
          <p className="text-[11px] text-slate-500">{filtered.length} of {students.length} shown</p>
        </div>
        <label className="relative flex min-w-[200px] max-w-md flex-1 items-center">
          <Search className="pointer-events-none absolute left-2 size-4 text-slate-400" aria-hidden />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, roll, section, board reg…"
            className="w-full rounded-md border border-slate-200 py-1.5 pl-8 pr-2 text-sm text-slate-900 outline-none focus:border-slate-400"
          />
        </label>
      </div>
      <div className="max-h-[420px] overflow-auto">
        <table className="min-w-full text-left text-xs text-slate-800">
          <thead className="sticky top-0 bg-slate-50 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="border-b border-slate-200 px-2 py-2">Name</th>
              <th className="border-b border-slate-200 px-2 py-2">Roll</th>
              <th className="border-b border-slate-200 px-2 py-2">Section</th>
              <th className="border-b border-slate-200 px-2 py-2">Board reg.</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50/80">
                <td className="px-2 py-1.5 font-medium">{s.name}</td>
                <td className="px-2 py-1.5 font-mono text-[11px]">{s.rollNo}</td>
                <td className="px-2 py-1.5 text-slate-600">{s.section ?? "—"}</td>
                <td className="px-2 py-1.5 font-mono text-[11px] text-slate-600">{s.boardRegistrationNo ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
