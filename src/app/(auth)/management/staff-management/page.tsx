import { eq } from "drizzle-orm";
import { UserPlus } from "lucide-react";

import { HierarchyTree } from "@/src/components/management/HierarchyTree";
import { requireManagementSession } from "@/src/components/management/institution-access";
import { getStaffLicenseCap, STAFF_LICENSE_ROLES } from "@/src/components/management/staff-licenses";
import { db } from "@/src/lib/db";
import { platformUsers } from "@/src/db/schema";

export const dynamic = "force-dynamic";

function displayRole(role: string): string {
  if (role === "school_org") return "Owner / Institution";
  if (role === "management") return "Principal (Executive)";
  if (role === "admin") return "School Admin";
  if (role === "teacher") return "Teacher";
  if (role === "student") return "Student";
  if (role === "parent") return "Parent";
  if (role === "master_admin") return "Super Admin";
  return role;
}

export default async function StaffManagementPage() {
  const { tenantId, paid, role, session } = await requireManagementSession();
  const isOwner = role === "school_org";

  const rows = await db
    .select({
      id: platformUsers.id,
      displayName: platformUsers.displayName,
      email: platformUsers.email,
      role: platformUsers.role,
    })
    .from(platformUsers)
    .where(eq(platformUsers.schoolId, tenantId));

  const sorted = [...rows].sort((a, b) => a.displayName.localeCompare(b.displayName));
  const usedLicenses = sorted.filter((r) => STAFF_LICENSE_ROLES.has(r.role)).length;
  const cap = getStaffLicenseCap();

  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-lg font-bold text-white">Staff directory</h2>
        <p className="mt-1 text-sm text-slate-400">
          Tenant <span className="font-mono text-indigo-200/90">{tenantId}</span> — data is isolated to this school only.
        </p>
        <p className="mt-2 text-xs text-slate-500">
          Signed in as <span className="text-slate-300">{session.user?.email ?? session.user?.id}</span>
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <HierarchyTree staff={sorted.map((r) => ({ ...r, email: r.email }))} />
        <div className="rounded-2xl border border-slate-800/90 bg-slate-900/50 p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-amber-300/90">Licenses</p>
          <p className="mt-2 text-3xl font-bold text-white">
            {usedLicenses} <span className="text-lg font-medium text-slate-500">of</span> {cap}
          </p>
          <p className="mt-2 text-xs text-slate-500">Active staff seats (excludes students/parents).</p>
        </div>
      </div>

      <section id="delegation" className="scroll-mt-28 rounded-2xl border border-indigo-500/25 bg-slate-900/40 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-indigo-300/90">
              User management & delegation
            </p>
            <h3 className="mt-1 text-lg font-semibold text-white">Admin console</h3>
            <p className="mt-2 max-w-xl text-sm text-slate-400">
              Invite or create <strong className="text-slate-200">Principal</strong> accounts and delegate authority
              down the hierarchy. Available only when the institution is in paid mode and you are the Owner.
            </p>
          </div>
          <div
            className={`rounded-lg border px-3 py-2 text-xs font-medium ${
              paid && isOwner
                ? "border-emerald-500/40 bg-emerald-950/30 text-emerald-200"
                : "border-slate-700 bg-slate-950 text-slate-500"
            }`}
          >
            {paid && isOwner ? "Unlocked" : paid ? "Owner only" : "Locked (demo)"}
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={!(paid && isOwner)}
            className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow disabled:cursor-not-allowed disabled:opacity-40"
            title={paid && isOwner ? "Wire to invite API" : "Enable paid billing and sign in as Owner"}
          >
            <UserPlus className="size-4" aria-hidden />
            Invite principal
          </button>
          <p className="self-center text-xs text-slate-500">Invitation pipeline hooks to your auth / mail provider next.</p>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-800/90 bg-slate-950/60">
        <div className="border-b border-slate-800/80 px-4 py-3">
          <h3 className="text-sm font-semibold text-white">All roles</h3>
          <p className="text-xs text-slate-500">Edit permissions is Owner-only and requires paid mode.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-900/80 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/90">
              {sorted.map((row) => (
                <tr key={row.id} className="hover:bg-slate-900/40">
                  <td className="px-4 py-3 font-medium text-white">{row.displayName || "—"}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-400">{row.email}</td>
                  <td className="px-4 py-3">{displayRole(row.role)}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      disabled={!(paid && isOwner)}
                      className="rounded-md border border-indigo-500/40 px-3 py-1.5 text-xs font-semibold text-indigo-200 hover:bg-indigo-500/10 disabled:cursor-not-allowed disabled:opacity-40"
                      title={
                        paid && isOwner
                          ? "Permission matrix editor (next iteration)"
                          : "Only the paid Owner can edit permissions"
                      }
                    >
                      Edit permissions
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
