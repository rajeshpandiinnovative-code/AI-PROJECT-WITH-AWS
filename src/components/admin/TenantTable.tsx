import { impersonateTenantAction } from "@/src/app/admin/actions";

type TenantRow = {
  id: string;
  schoolName: string;
  location: string;
  activeStudents: number;
  subscriptionStatus: string;
};

export function TenantTable({ rows }: { rows: TenantRow[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-900/60">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-900">
            <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
              <th className="px-4 py-3">School Name</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Active Students</th>
              <th className="px-4 py-3">Subscription</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {rows.map((row) => (
              <tr key={row.id} className="text-slate-200">
                <td className="px-4 py-3">{row.schoolName}</td>
                <td className="px-4 py-3">{row.location}</td>
                <td className="px-4 py-3 tabular-nums">{row.activeStudents}</td>
                <td className="px-4 py-3">
                  <span className="rounded-md border border-slate-600 px-2 py-1 text-xs">{row.subscriptionStatus}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <form action={impersonateTenantAction}>
                    <input type="hidden" name="tenantId" value={row.id} />
                    <button
                      type="submit"
                      className="rounded-md border border-amber-500/40 px-3 py-1.5 text-xs font-semibold text-amber-200 hover:bg-amber-950/40"
                    >
                      Impersonate
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
