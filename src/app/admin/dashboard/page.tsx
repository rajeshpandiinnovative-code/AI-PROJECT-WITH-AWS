import { and, count, desc, eq, gte, ilike, inArray, sql } from "drizzle-orm";

import { setAiModelAction } from "@/src/app/admin/actions";
import { CorrespondentExecutiveDashboard } from "@/src/components/admin/CorrespondentExecutiveDashboard";
import { LiveLogsFeed } from "@/src/components/admin/LiveLogsFeed";
import { analyticsEvents, moduleHistories, platformUsers, results, revenueEvents, schools, students } from "@/src/db/schema";
import { db, pingDatabase } from "@/src/lib/db";
import { requireFounder } from "@/src/lib/founder-access";
import { resolveGeminiModel } from "@/src/lib/gemini-runtime-model";

type Props = {
  searchParams: Promise<{ q?: string; modelUpdated?: string; modelError?: string }>;
};

export default async function FounderAdminDashboard({ searchParams }: Props) {
  await requireFounder();
  const search = await searchParams;
  const q = search.q?.trim();

  const [schoolCountRow] = await db.select({ n: count() }).from(schools);
  const [enrollmentCountRow] = await db.select({ n: count() }).from(students);
  const [gradedCountRow] = await db.select({ n: count() }).from(results);
  const [teacherCountRow] = await db
    .select({ n: count() })
    .from(platformUsers)
    .where(inArray(platformUsers.role, ["teacher", "admin", "management", "school_org"]));
  const [tokenEvents] = await db
    .select({ n: sql<number>`coalesce(count(${moduleHistories.id}),0)` })
    .from(moduleHistories);
  const [avgPerformanceRow] = await db
    .select({
      avg: sql<number>`coalesce(avg(${results.marks}), 0)`,
    })
    .from(results);

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const [papersThisWeekRow] = await db
    .select({ n: count() })
    .from(results)
    .where(gte(results.createdAt, weekAgo));

  const termStart = new Date(now.getFullYear(), now.getMonth() - 2, 1);
  const [termRevenueRow] = await db
    .select({ total: sql<number>`coalesce(sum(${revenueEvents.amountMinor}), 0)` })
    .from(revenueEvents)
    .where(gte(revenueEvents.occurredAt, termStart));

  const monthlyRevenueRows = await db
    .select({
      month: sql<string>`to_char(date_trunc('month', ${revenueEvents.occurredAt}), 'Mon')`,
      total: sql<number>`coalesce(sum(${revenueEvents.amountMinor}),0)`,
    })
    .from(revenueEvents)
    .where(gte(revenueEvents.occurredAt, new Date(now.getFullYear(), now.getMonth() - 5, 1)))
    .groupBy(sql`date_trunc('month', ${revenueEvents.occurredAt})`)
    .orderBy(sql`date_trunc('month', ${revenueEvents.occurredAt})`);

  const totalSchools = Number(schoolCountRow?.n ?? 0);
  const totalEnrollment = Number(enrollmentCountRow?.n ?? 0);
  const totalPapersGraded = Number(gradedCountRow?.n ?? 0);
  const papersThisWeek = Number(papersThisWeekRow?.n ?? 0);
  const teacherAudience = Number(teacherCountRow?.n ?? 0);
  const tokenUsage = Number(tokenEvents?.n ?? 0);
  const tokenCostInr = tokenUsage * 0.35;
  const avgPerformance = Math.round(Number(avgPerformanceRow?.avg ?? 0));
  const totalFeeCollectedMinor = Number(termRevenueRow?.total ?? 0);
  const feeTargetMinor = Math.max(1, totalSchools * 5000000);
  const feeCollectionPercent = (totalFeeCollectedMinor / feeTargetMinor) * 100;
  const productivityBoost = Math.min(96, 25 + Math.round((papersThisWeek / 150) * 35));
  const aiCreditsRemaining = Math.max(0, 5000 - tokenUsage);

  const financialSeries = monthlyRevenueRows.map((r) => {
    const collectedInr = Math.round(Number(r.total) / 100);
    const targetInr = Math.max(100000, Math.round(collectedInr * 1.15));
    return { month: r.month, collected: collectedInr, target: targetInr };
  });

  const recentLogs = await db
    .select({
      id: analyticsEvents.id,
      eventType: analyticsEvents.eventType,
      createdAt: analyticsEvents.createdAt,
      payload: analyticsEvents.payload,
    })
    .from(analyticsEvents)
    .orderBy(desc(analyticsEvents.createdAt))
    .limit(12);

  const model = await resolveGeminiModel();
  const modelFlag = search.modelUpdated === "1";
  const modelErrorFlag = search.modelError === "1";

  const searchResults = q
    ? await Promise.all([
        db
          .select({
            id: students.id,
            name: students.name,
            schoolId: students.schoolId,
            kind: sql<"student">`'student'`,
          })
          .from(students)
          .where(ilike(students.name, `%${q}%`))
          .limit(8),
        db
          .select({
            id: platformUsers.id,
            name: platformUsers.displayName,
            schoolId: platformUsers.schoolId,
            kind: sql<"teacher">`'teacher'`,
          })
          .from(platformUsers)
          .where(
            and(
              ilike(platformUsers.displayName, `%${q}%`),
              inArray(platformUsers.role, ["teacher", "admin", "management", "school_org"]),
            ),
          )
          .limit(8),
      ])
    : [[], []];

  const dbStart = Date.now();
  let dbLatencyMs = -1;
  try {
    await pingDatabase();
    dbLatencyMs = Date.now() - dbStart;
  } catch {
    dbLatencyMs = -1;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-white">Founder's Command Center</h1>
          <p className="mt-1 text-sm text-blue-100/80">
            Institutional management cockpit for multi-tenant operations, analytics, and executive decisions.
          </p>
          <p className="mt-1 text-xs text-blue-200/70">
            OCR total papers graded: {totalPapersGraded.toLocaleString("en-IN")} · Estimated AI cost: INR{" "}
            {Math.round(tokenCostInr).toLocaleString("en-IN")}
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <MetricCard title="Total Fee Collected (Term)" value={`INR ${(totalFeeCollectedMinor / 100).toLocaleString("en-IN")}`} tone="gold" />
        <MetricCard title="Average School Performance" value={`${avgPerformance}%`} tone="blue" />
        <MetricCard title="AI Credits Remaining" value={aiCreditsRemaining.toLocaleString("en-IN")} tone="blue" />
        <MetricCard title="Teacher Productivity Boost" value={`${productivityBoost}%`} tone="gold" />
      </div>

      <CorrespondentExecutiveDashboard
        feeCollectionPercent={feeCollectionPercent}
        papersThisWeek={papersThisWeek}
        financialSeries={financialSeries}
        teacherAudience={teacherAudience}
      />

      <section className="rounded-xl border border-blue-800/60 bg-[#091a35] p-4">
        <h3 className="text-sm font-semibold text-white">Model Control</h3>
        <p className="mt-1 text-xs text-blue-100/80">
          Persists in PostgreSQL and applies to grading and all text Gemini modules for every tenant (overrides{" "}
          <code className="text-amber-200/90">GEMINI_MODEL</code> when set).
        </p>
        <form action={setAiModelAction} className="mt-3 flex flex-wrap items-center gap-2">
          <select
            name="model"
            defaultValue={model}
            className="rounded-md border border-blue-700 bg-[#08162e] px-3 py-2 text-sm text-white"
          >
            <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
            <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
            <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
          </select>
          <button type="submit" className="rounded-md bg-amber-400 px-3 py-2 text-sm font-semibold text-slate-950">
            Apply globally
          </button>
          {modelFlag ? <span className="text-xs text-emerald-300">Model saved.</span> : null}
          {modelErrorFlag ? <span className="text-xs text-rose-300">Invalid model.</span> : null}
        </form>
      </section>

      {q ? (
        <section className="rounded-xl border border-blue-800/60 bg-[#091a35] p-4">
          <h3 className="text-sm font-semibold text-white">Global Search Results</h3>
          <p className="mt-1 text-xs text-blue-100/80">Query: {q}</p>
          <ul className="mt-3 space-y-2">
            {[...searchResults[0], ...searchResults[1]].map((r) => (
              <li key={`${r.kind}-${r.id}`} className="rounded-md border border-blue-900 px-3 py-2 text-xs text-slate-100">
                <span className="font-semibold">{r.name || "(unnamed)"}</span>
                <span className="ml-2 text-blue-200">[{r.kind}]</span>
                <span className="ml-2 font-mono text-blue-300">{r.schoolId ?? "no-tenant"}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2">
        <MetricCard
          title="RDS PostgreSQL Health"
          value={dbLatencyMs >= 0 ? `Connected (${dbLatencyMs}ms)` : "Connection degraded"}
          tone={dbLatencyMs >= 0 ? "blue" : "rose"}
        />
        <MetricCard
          title="National Enrollment"
          value={totalEnrollment.toLocaleString("en-IN")}
          tone="blue"
        />
      </section>

      <LiveLogsFeed
        initial={recentLogs.map((log) => {
          const payload = log.payload as Record<string, unknown>;
          let details: string | undefined;
          if (log.eventType === "login_success") {
            details = `Activity from ${payload?.role ?? "user"}`;
          } else if (log.eventType === "admin_gemini_model_changed") {
            details = typeof payload?.model === "string" ? `Global text model → ${payload.model}` : "Global text model updated";
          }
          return {
            id: log.id,
            eventType: log.eventType,
            createdAt: log.createdAt.toISOString(),
            details,
          };
        })}
      />

      <section className="rounded-xl border border-blue-800/60 bg-[#091a35] p-4 text-xs text-blue-100/80">
        <p>
          Built for Srivilliputhur, scalable for India. Proudly developed by Pinnacle Software Solution.
        </p>
      </section>
    </div>
  );
}

function MetricCard({
  title,
  value,
  tone,
}: {
  title: string;
  value: string;
  tone: "blue" | "gold" | "rose";
}) {
  const styles: Record<typeof tone, string> = {
    blue: "border-blue-700/60 bg-[#091a35] text-blue-100",
    gold: "border-amber-400/40 bg-amber-950/20 text-amber-100",
    rose: "border-rose-500/40 bg-rose-950/20 text-rose-100",
  };
  return (
    <div className={`rounded-xl border p-4 ${styles[tone]}`}>
      <p className="text-xs uppercase tracking-wide opacity-90">{title}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
}
