import type { ReactNode } from "react";
import { eq } from "drizzle-orm";

import { ManagementSidebar } from "@/src/components/management/ManagementSidebar";
import { requireManagementSession } from "@/src/components/management/institution-access";
import { schools } from "@/src/db/schema";
import { db } from "@/src/lib/db";

/** Shell for routes under `/management` that live outside `(auth)` (e.g. command-center dashboard). */
export default async function InstitutionManagementLayout({ children }: { children: ReactNode }) {
  const { tenantId, paid, role } = await requireManagementSession();

  const school = await db.query.schools.findFirst({
    where: eq(schools.id, tenantId),
    columns: { name: true, udiseCode: true },
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <ManagementSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="border-b border-slate-800/90 bg-slate-900/80 px-4 py-4 backdrop-blur">
            <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-indigo-300/90">
                  Hierarchical dashboard
                </p>
                <h1 className="mt-1 text-xl font-bold text-white sm:text-2xl">{school?.name ?? "Your institution"}</h1>
                {school?.udiseCode ? (
                  <p className="mt-1 font-mono text-xs text-slate-500">UDISE {school.udiseCode}</p>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-[11px] font-medium uppercase tracking-wide text-slate-400">
                  Role:{" "}
                  {role === "MANAGEMENT"
                    ? "Management"
                    : role === "SUPER_ADMIN"
                      ? "Super Admin"
                      : role}
                </span>
                <span
                  className={`rounded-md border px-2 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                    paid
                      ? "border-emerald-500/40 bg-emerald-950/40 text-emerald-200"
                      : "border-amber-500/40 bg-amber-950/35 text-amber-200"
                  }`}
                >
                  {paid ? "Paid institution" : "View-only demo"}
                </span>
              </div>
            </div>
          </header>
          <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
