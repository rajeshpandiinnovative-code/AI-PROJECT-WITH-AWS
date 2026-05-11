import { desc } from "drizzle-orm";

import { analyticsEvents } from "@/src/db/schema";
import { db } from "@/src/lib/db";
import { requireFounder } from "@/src/lib/founder-access";

export default async function AdminLogsPage() {
  await requireFounder();
  const rows = await db
    .select({
      id: analyticsEvents.id,
      eventType: analyticsEvents.eventType,
      createdAt: analyticsEvents.createdAt,
      payload: analyticsEvents.payload,
    })
    .from(analyticsEvents)
    .orderBy(desc(analyticsEvents.createdAt))
    .limit(40);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-white">System Logs</h1>
      <ul className="space-y-2">
        {rows.map((row) => (
          <li key={row.id} className="rounded-md border border-slate-700 bg-slate-900/60 p-3 text-xs">
            <p className="font-semibold text-slate-100">{row.eventType}</p>
            <p className="mt-1 text-slate-400">{row.createdAt.toLocaleString()}</p>
            <p className="mt-1 font-mono text-slate-500">{JSON.stringify(row.payload)}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
