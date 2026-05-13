import type { ReactNode } from "react";
import { eq } from "drizzle-orm";

import { requireStudentSession } from "@/src/components/student/student-access";
import { schools } from "@/src/db/schema";
import { db } from "@/src/lib/db";
import { isMockApiMode } from "@/src/lib/api-mode";

export default async function StudentInstitutionLayout({ children }: { children: ReactNode }) {
  if (isMockApiMode()) {
    return <>{children}</>;
  }

  const { schoolId } = await requireStudentSession();

  const school = await db.query.schools.findFirst({
    where: eq(schools.id, schoolId),
    columns: { name: true, udiseCode: true },
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-8">
        <header className="mb-8 border-b border-slate-800/90 pb-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-violet-300/90">Student portal</p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-white sm:text-2xl">{school?.name ?? "Your school"}</h1>
              {school?.udiseCode ? (
                <p className="mt-1 font-mono text-xs text-slate-500">UDISE {school.udiseCode}</p>
              ) : null}
            </div>
            <span className="rounded-md border border-violet-500/30 bg-violet-950/40 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-violet-200">
              Role: Student
            </span>
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}
