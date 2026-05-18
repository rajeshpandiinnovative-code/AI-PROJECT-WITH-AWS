import { count, eq } from "drizzle-orm";

import { clearImpersonationAction, createTenantAction } from "@/src/app/admin/actions";
import { TenantTable } from "@/src/components/admin/TenantTable";
import { schools, students } from "@/src/db/schema";
import { db } from "@/src/lib/db";
import { requireFounder } from "@/src/lib/founder-access";

export default async function SchoolManagementPage() {
  await requireFounder();

  const schoolRows = await db.select().from(schools);
  const rows = await Promise.all(
    schoolRows.map(async (s) => {
      const [studentStat] = await db.select({ n: count() }).from(students).where(eq(students.schoolId, s.id));
      return {
        id: s.id,
        schoolName: s.name,
        location: s.district,
        activeStudents: Number(studentStat?.n ?? 0),
        subscriptionStatus: s.subscriptionStatus,
      };
    }),
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">School Management</h1>

      <section className="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
        <h2 className="text-sm font-semibold text-white">Create New Tenant</h2>
        <p className="mt-1 text-xs text-slate-400">Onboard schools like Valluvar Vidyalaya.</p>
        <form action={createTenantAction} className="mt-3 grid gap-3 sm:grid-cols-4">
          <input
            name="name"
            required
            placeholder="School name (e.g., Valluvar Vidyalaya)"
            className="rounded-md border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-white sm:col-span-2"
          />
          <input
            name="location"
            required
            placeholder="Location (e.g., SVPR)"
            className="rounded-md border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-white"
          />
          <input
            name="board"
            defaultValue="MATRIC"
            placeholder="Board"
            className="rounded-md border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-white"
          />
          <button
            type="submit"
            className="rounded-md bg-cyan-600 px-3 py-2 text-sm font-semibold text-white sm:col-span-4 sm:w-fit"
          >
            Create tenant
          </button>
        </form>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-300">School Directory</h2>
          <form action={clearImpersonationAction}>
            <button type="submit" className="rounded-md border border-slate-600 px-3 py-1.5 text-xs text-slate-200">
              Clear impersonation
            </button>
          </form>
        </div>
        <TenantTable rows={rows} />
      </section>
    </div>
  );
}
