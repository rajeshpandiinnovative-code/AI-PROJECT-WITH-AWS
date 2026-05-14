import { and, count, desc, eq, gte, sql } from "drizzle-orm";

import { importStudentsCsvAction } from "@/src/app/(auth)/school-admin/actions";
import { ModuleToggle } from "@/src/components/school-admin/ModuleToggle";
import { requireSchoolAdminSession } from "@/src/components/school-admin/school-admin-access";
import { StudentTable } from "@/src/components/school-admin/StudentTable";
import { StandardPerformanceChart } from "@/src/components/admin/StandardPerformanceChart";
import {
  analyticsEvents,
  moduleHistories,
  platformUsers,
  schoolModuleGradePolicies,
  students,
} from "@/src/db/schema";
import { db } from "@/src/lib/db";
import { allModules } from "@/src/lib/modules";
import { getStandardWisePerformance } from "@/src/app/actions/compliance";

export const dynamic = "force-dynamic";

const GRADE_BANDS = ["Primary (1-5)", "Middle (6-8)", "Secondary (9-10)", "Higher (11-12)"] as const;

const MODULES_FOR_GRID = allModules.slice(0, 12);

type PageProps = {
  searchParams: Promise<{ imported?: string; errs?: string; import?: string }>;
};

export default async function SchoolAdminOperationsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const { tenantId, session } = await requireSchoolAdminSession();
  const tenantText = tenantId;
  const userRole = (session.user?.role ?? "").toUpperCase();
  const isPrincipalOrAbove = userRole === "PRINCIPAL" || userRole === "MANAGEMENT" || userRole === "SUPER_ADMIN";

  const [studentCountRow] = await db
    .select({ n: count() })
    .from(students)
    .where(eq(students.schoolId, tenantId));

  const [teacherRosterRow] = await db
    .select({ n: count() })
    .from(platformUsers)
    .where(and(eq(platformUsers.schoolId, tenantId), eq(platformUsers.role, "TEACHER")));

  const [scanRow] = await db
    .select({ n: count() })
    .from(moduleHistories)
    .where(
      and(
        eq(moduleHistories.schoolId, tenantText),
        eq(moduleHistories.moduleSlug, "handwriting-improvement"),
        gte(moduleHistories.createdAt, sql`(now() - interval '48 hours')`),
      ),
    );

  const recentLogins = await db
    .select({ payload: analyticsEvents.payload })
    .from(analyticsEvents)
    .where(
      and(
        eq(analyticsEvents.eventType, "login_success"),
        gte(analyticsEvents.createdAt, sql`(now() - interval '8 hours')`),
      ),
    )
    .orderBy(desc(analyticsEvents.createdAt))
    .limit(600);

  const activeTeacherIds = new Set<string>();
  for (const row of recentLogins) {
    const p = row.payload as Record<string, unknown>;
    if (p.schoolId === tenantId && p.role === "TEACHER" && typeof p.platformUserId === "string") {
      activeTeacherIds.add(p.platformUserId);
    }
  }

  const studentRows = await db
    .select({
      id: students.id,
      name: students.name,
      rollNo: students.rollNo,
      section: students.section,
      boardRegistrationNo: students.boardRegistrationNo,
    })
    .from(students)
    .where(eq(students.schoolId, tenantId))
    .orderBy(students.name);

  const policyRows = await db
    .select({
      gradeLabel: schoolModuleGradePolicies.gradeLabel,
      moduleSlug: schoolModuleGradePolicies.moduleSlug,
      enabled: schoolModuleGradePolicies.enabled,
    })
    .from(schoolModuleGradePolicies)
    .where(eq(schoolModuleGradePolicies.schoolId, tenantId));

  const policyMap: Record<string, Record<string, boolean>> = {};
  for (const g of GRADE_BANDS) {
    policyMap[g] = {};
  }
  for (const r of policyRows) {
    if (!policyMap[r.gradeLabel]) policyMap[r.gradeLabel] = {};
    policyMap[r.gradeLabel][r.moduleSlug] = r.enabled;
  }

  const totalStudents = Number(studentCountRow?.n ?? 0);
  const teachersRoster = Number(teacherRosterRow?.n ?? 0);
  const pendingPaperScans = Number(scanRow?.n ?? 0);
  const activeTeachersSession = activeTeacherIds.size;

  let standardData: Awaited<ReturnType<typeof getStandardWisePerformance>> | null = null;
  if (isPrincipalOrAbove) {
    standardData = await getStandardWisePerformance(tenantId);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-3 py-5 sm:px-4">
      {sp.import === "no_file" || sp.import === "empty" ? (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {sp.import === "no_file" ? "Choose a CSV file before importing." : "That CSV had no rows."}
        </div>
      ) : sp.imported !== undefined ? (
        <div className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          Import finished: {sp.imported} row(s) inserted.
          {sp.errs ? ` ${sp.errs} row(s) skipped or errored.` : ""}
        </div>
      ) : null}

      <header className="border-b border-slate-200 pb-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">School Admin Operations</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Operations dashboard</h1>
        <p className="mt-1 text-xs text-slate-600">
          Tenant <span className="font-mono text-slate-800">{tenantId}</span> · Role{" "}
          <span className="font-semibold">{session.user?.role ?? "—"}</span>
        </p>
        <p className="mt-2 max-w-3xl text-[11px] leading-relaxed text-slate-500">
          Data entry, resource allocation, and class throughput. No fee collection or financial growth charts here —
          those remain in Management.
        </p>
      </header>

      <section className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Students enrolled" value={String(totalStudents)} hint="Current roster in this tenant." />
        <Metric label="Today's attendance %" value="—" hint="Wire daily feed (calendar block below)." />
        <Metric
          label="Pending paper scans"
          value={String(pendingPaperScans)}
          hint="48h handwriting / OCR pipeline events (proxy for grading queue)."
        />
        <Metric
          label="Teachers active (8h)"
          value={String(activeTeachersSession)}
          hint={`Distinct teacher logins vs roster ${teachersRoster}.`}
        />
      </section>

      {isPrincipalOrAbove && (
        <section id="standard-performance" className="scroll-mt-4">
          <StandardPerformanceChart
            schoolId={tenantId}
            initialData={standardData?.success ? standardData.data : null}
          />
        </section>
      )}

      <section id="students" className="scroll-mt-4 space-y-2">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700">Students</h2>
        <StudentTable students={studentRows} />
      </section>

      <section id="modules" className="scroll-mt-4 space-y-2">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700">AI module settings</h2>
        <ModuleToggle
          gradeLabels={GRADE_BANDS}
          modules={MODULES_FOR_GRID.map((m) => ({ slug: m.slug, title: m.title }))}
          initialEnabled={policyMap}
        />
      </section>

      <section id="import" className="scroll-mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700">Data import center</h2>
        <p className="mt-1 text-[11px] text-slate-600">
          CSV columns: <code className="rounded bg-white px-1">name</code>,{" "}
          <code className="rounded bg-white px-1">roll_no</code>, optional{" "}
          <code className="rounded bg-white px-1">section</code>, optional{" "}
          <code className="rounded bg-white px-1">board_registration_no</code>.
        </p>
        <form action={importStudentsCsvAction} className="mt-3 flex flex-wrap items-end gap-3">
          <label className="block text-xs font-medium text-slate-700">
            <span className="mb-1 block">CSV / Excel (save as CSV)</span>
            <input
              type="file"
              name="file"
              accept=".csv,text/csv"
              className="block w-full max-w-xs text-xs file:mr-2 file:rounded file:border file:border-slate-300 file:bg-white file:px-2 file:py-1"
            />
          </label>
          <button
            type="submit"
            className="rounded-md bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
          >
            Bulk import
          </button>
        </form>
      </section>

      <section id="classes" className="scroll-mt-4 rounded-lg border border-dashed border-slate-300 bg-white p-4">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700">Attendance & timetable</h2>
        <div className="mt-3 grid gap-2 text-[11px] text-slate-600 sm:grid-cols-7">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <div key={d} className="min-h-[72px] rounded border border-slate-200 bg-slate-50 p-2">
              <p className="font-semibold text-slate-800">{d}</p>
              <p className="mt-1 text-[10px] text-slate-500">Periods + AI attendance log sync next.</p>
            </div>
          ))}
        </div>
      </section>

      <section id="support" className="scroll-mt-4 rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700">Support</h2>
        <p className="mt-2 text-xs text-slate-600">
          Escalate to Management for billing, or open the{" "}
          <a className="font-semibold text-slate-900 underline" href="/school/dashboard">
            school console
          </a>{" "}
          for interventions and charts.
        </p>
      </section>
    </div>
  );
}

function Metric({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-bold tabular-nums text-slate-900">{value}</p>
      <p className="mt-0.5 text-[10px] leading-snug text-slate-500">{hint}</p>
    </div>
  );
}
