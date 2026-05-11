"use client";

import { useEffect, useState } from "react";

type LogRow = {
  id: string;
  eventType: string;
  createdAt: string;
  details?: string;
};

export function LiveLogsFeed({ initial }: { initial: LogRow[] }) {
  const [rows, setRows] = useState<LogRow[]>(initial);

  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const res = await fetch("/api/admin/live-logs", { cache: "no-store" });
        if (!res.ok) return;
        const payload = (await res.json()) as { data: LogRow[] };
        setRows(payload.data);
      } catch {
        // no-op
      }
    }, 8000);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
      <h3 className="text-sm font-semibold text-white">Live Logs</h3>
      <p className="mt-1 text-xs text-slate-400">Auto-refresh every 8 seconds</p>
      <ul className="mt-3 space-y-2">
        {rows.map((row) => (
          <li key={row.id} className="rounded-md border border-slate-700 bg-slate-950/60 px-3 py-2 text-xs">
            <p className="font-medium text-slate-100">{row.eventType}</p>
            {row.details ? <p className="mt-1 text-slate-400">{row.details}</p> : null}
            <p className="mt-1 text-slate-500">{new Date(row.createdAt).toLocaleString()}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
