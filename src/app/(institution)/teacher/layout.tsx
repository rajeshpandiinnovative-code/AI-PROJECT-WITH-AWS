import type { ReactNode } from "react";
import { eq } from "drizzle-orm";

import { TeacherSidebar } from "@/src/components/teacher/TeacherSidebar";
import { requireTeacherSession } from "@/src/components/teacher/teacher-access";
import { schools } from "@/src/db/schema";
import { db } from "@/src/lib/db";

export default async function TeacherInstitutionLayout({ children }: { children: ReactNode }) {
  const { tenantId } = await requireTeacherSession();

  const school = await db.query.schools.findFirst({
    where: eq(schools.id, tenantId),
    columns: { name: true, udiseCode: true },
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <TeacherSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="border-b border-slate-800/90 bg-slate-900/80 px-4 py-4 backdrop-blur">
            <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-teal-300/90">Paper scanning</p>
                <h1 className="mt-1 text-xl font-bold text-white sm:text-2xl">{school?.name ?? "Your school"}</h1>
                {school?.udiseCode ? (
                  <p className="mt-1 font-mono text-xs text-slate-500">UDISE {school.udiseCode}</p>
                ) : null}
              </div>
              <span className="rounded-md border border-teal-500/30 bg-teal-950/40 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-teal-200">
                Role: Teacher
              </span>
            </div>
          </header>
          <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
