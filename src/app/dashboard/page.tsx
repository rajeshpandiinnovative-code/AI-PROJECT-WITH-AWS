import Link from "next/link";
import type { Metadata } from "next";
import { count, desc, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LayoutDashboard, ExternalLink, ScanLine } from "lucide-react";

import { auth } from "@/auth";
import { assignIntervention, generateDailyInterventionDigest } from "@/src/app/actions/interventions";
import { DashboardInsightCharts } from "@/src/components/dashboard/DashboardInsightCharts";
import { PlatformRoleDashboard } from "@/src/components/dashboard/PlatformRoleDashboard";
import {
  buildDemoChartsPayload,
  buildSchoolChartsPayload,
  parseDemoCookie,
} from "@/src/lib/dashboard-chart-data";
import { db } from "@/src/lib/db";
import { allModules } from "@/src/lib/modules";
import {
  exams,
  interventionAuditLogs,
  interventionDailyDigests,
  interventionTasks,
  moduleHistories,
  results,
  schools,
  students,
} from "@/src/db/schema";

import { DashboardDevSessionBanner } from "@/src/components/dashboard/DashboardDevSessionBanner";
import { InterventionTrackerSection } from "@/src/components/InterventionTrackerSection";
import { PilotNav } from "@/src/components/PilotNav";
import { isPlatformDashboardWithoutSchoolAllowed } from "@/src/lib/env";
import { resolveSessionTenantIds } from "@/src/lib/session-tenant";
import { isMasterAdminSession } from "@/src/lib/master-admin";
import { getImpersonatedTenantId } from "@/src/lib/rbac";
import { isPaidSubscriptionEnforced, sessionHasPaidAccess } from "@/src/lib/subscription";

export const metadata: Metadata = {
  title: "Dashboard · AI Academy Pro",
  description: "School operations console and role dashboards with insights and exports.",
};

export const dynamic = "force-dynamic";

type DashboardPageProps = {
  searchParams: Promise<{ debug?: string }>;
};

function parseScoreRatio(value: unknown): number | null {
  if (typeof value !== "string") return null;
  const match = value.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (!match) return null;
  const numerator = Number(match[1]);
  const denominator = Number(match[2]);
  if (denominator <= 0) return null;
  return Math.round((numerator / denominator) * 100);
}

function parsePercent(value: unknown): number | null {
  if (typeof value !== "string") return null;
  const match = value.match(/^(\d+(?:\.\d+)?)%$/);
  if (!match) return null;
  return Math.round(Number(match[1]));
}

function buildInterventionAction(moduleTitle: string, avgScore: number | null, trend: number | null): string {
  if (avgScore !== null && avgScore < 50) {
    return `Run a 3-day reteach sprint for ${moduleTitle} with daily 10-question checkpoints.`;
  }
  if (trend !== null && trend < 0) {
    return `Start correction loops in ${moduleTitle}: mistake log + next-day re-attempt drills.`;
  }
  return `Maintain guided practice in ${moduleTitle} and increase challenge difficulty gradually.`;
}

function formatAuditAction(actionType: string): string {
  if (actionType === "bulk_followup_overdue") return "Bulk follow-up overdue";
  if (actionType === "bulk_complete_critical") return "Bulk complete critical";
  if (actionType === "single_assign") return "Single assignment";
  if (actionType === "single_complete") return "Single completion";
  if (actionType === "daily_digest_generate") return "Daily digest (manual)";
  if (actionType === "daily_digest_generate_cron") return "Daily digest (cron)";
  return actionType;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const q = await searchParams;
  const showDevSessionBanner = process.env.NODE_ENV === "development" && q.debug === "session";

  const session = await auth();
  const cookieStore = await cookies();
  const { schoolId, platformUserId } = resolveSessionTenantIds(session);
  const impersonatedTenantId = isMasterAdminSession(session) ? getImpersonatedTenantId(cookieStore) : undefined;

  if (!session?.user) {
    redirect("/login?callbackUrl=%2Fdashboard");
  }

  if (!schoolId && !platformUserId) {
    redirect("/login?callbackUrl=%2Fdashboard");
  }

  if (isPaidSubscriptionEnforced() && !(await sessionHasPaidAccess(session))) {
    redirect("/pricing?reason=subscription");
  }

  if (!schoolId && platformUserId && session && !impersonatedTenantId) {
    if (!isPlatformDashboardWithoutSchoolAllowed()) {
      redirect("/onboarding");
    }
    const demoRaw = cookieStore.get("aap_demo")?.value;
    const demo = parseDemoCookie(demoRaw);
    const charts = buildDemoChartsPayload(demo, session.user?.role, session.user?.email ?? undefined);
    return (
      <>
        <DashboardDevSessionBanner
          show={showDevSessionBanner}
          session={session}
          schoolId={schoolId}
          platformUserId={platformUserId}
          variant="platform"
        />
        <PlatformRoleDashboard
          session={session}
          demo={demo}
          charts={charts}
          showMasterInsights={isMasterAdminSession(session)}
        />
      </>
    );
  }

  const activeSchoolId = impersonatedTenantId ?? schoolId;
  if (!activeSchoolId) {
    redirect("/onboarding");
  }

  const school = await db.query.schools.findFirst({
    where: eq(schools.id, activeSchoolId),
  });

  if (!school) {
    redirect("/onboarding");
  }

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const nowIsoDate = now.toISOString().slice(0, 10);
  const fromIsoDate = thirtyDaysAgo.toISOString().slice(0, 10);
  const trackerExportAllHref = "/api/interventions/export?type=tracker";
  const trackerExport30dHref = `/api/interventions/export?type=tracker&from=${fromIsoDate}&to=${nowIsoDate}`;
  const trackerExportHomeworkHref = "/api/interventions/export?type=tracker&module=Homework%20Helper";
  const trackerExportWeakArea30dHref = `/api/interventions/export?type=tracker&module=Weak%20Area%20Detection&from=${fromIsoDate}&to=${nowIsoDate}`;
  const auditExportAllHref = "/api/interventions/export?type=audit";
  const auditExport30dHref = `/api/interventions/export?type=audit&from=${fromIsoDate}&to=${nowIsoDate}`;
  const auditExportBulkCriticalHref = "/api/interventions/export?type=audit&actionType=bulk_complete_critical";
  const auditExportBulkFollowup30dHref = `/api/interventions/export?type=audit&actionType=bulk_followup_overdue&from=${fromIsoDate}&to=${nowIsoDate}`;
  const digestExportAllHref = "/api/interventions/export?type=digest";
  const digestExport30dHref = `/api/interventions/export?type=digest&from=${fromIsoDate}&to=${nowIsoDate}`;

  const [studentStat] = await db
    .select({ n: count() })
    .from(students)
    .where(eq(students.schoolId, activeSchoolId));
  const [examStat] = await db
    .select({ n: count() })
    .from(exams)
    .where(eq(exams.schoolId, activeSchoolId));
  const [resultStat] = await db
    .select({ n: count() })
    .from(results)
    .where(eq(results.schoolId, activeSchoolId));

  const studentCount = Number(studentStat?.n ?? 0);
  const examCount = Number(examStat?.n ?? 0);
  const resultCount = Number(resultStat?.n ?? 0);

  const recentResults = await db
    .select({
      id: results.id,
      marks: results.marks,
      createdAt: results.createdAt,
      studentName: students.name,
      examName: exams.name,
    })
    .from(results)
    .innerJoin(students, eq(results.studentId, students.id))
    .innerJoin(exams, eq(results.examId, exams.id))
    .where(eq(results.schoolId, activeSchoolId))
    .orderBy(desc(results.createdAt))
    .limit(12);

  const watchlistRows = recentResults
    .filter((r) => Number(r.marks ?? 0) < 40)
    .slice(0, 8)
    .map((r) => {
      const marks = Number(r.marks ?? 0);
      let recommendedModule = "AI Study Planner";
      if (marks < 25) {
        recommendedModule = "Weak Area Detection";
      } else if (marks < 30) {
        recommendedModule = "Homework Helper";
      } else if (marks < 35) {
        recommendedModule = "Memory Techniques";
      }
      return {
        ...r,
        sourceResultId: r.id,
        marks,
        riskBand: marks < 25 ? "Critical" : marks < 33 ? "High" : "Moderate",
        recommendedModule,
      };
    });

  const recentInterventions = await db.query.interventionTasks.findMany({
    where: eq(interventionTasks.schoolId, activeSchoolId),
    orderBy: [desc(interventionTasks.createdAt)],
    limit: 20,
  });
  const nowMs = now.getTime();
  const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

  const interventionRows = recentInterventions.map((task) => {
    const ageMs = nowMs - task.createdAt.getTime();
    const ageDays = Math.max(0, Math.floor(ageMs / (24 * 60 * 60 * 1000)));
    const overdue = task.status !== "completed" && ageMs > threeDaysMs;
    const criticalDelay = task.status !== "completed" && ageMs > sevenDaysMs;
    return {
      ...task,
      ageDays,
      overdue,
      criticalDelay,
    };
  });
  const openInterventionCount = interventionRows.filter((task) => task.status !== "completed").length;
  const overdueInterventionCount = interventionRows.filter((task) => task.overdue).length;
  const criticalDelayCount = interventionRows.filter((task) => task.criticalDelay).length;
  const overdueRate = openInterventionCount > 0 ? Math.round((overdueInterventionCount / openInterventionCount) * 100) : 0;
  const criticalRate = openInterventionCount > 0 ? Math.round((criticalDelayCount / openInterventionCount) * 100) : 0;
  const slaStatus = criticalDelayCount > 0 ? "critical" : overdueInterventionCount > 0 ? "at-risk" : "healthy";
  const slaMessage =
    slaStatus === "critical"
      ? "Critical delays present. Resolve oldest interventions within 24 hours."
      : slaStatus === "at-risk"
        ? "SLA at risk. Schedule targeted follow-ups for overdue students this week."
        : "SLA healthy. Keep weekly follow-up rhythm to maintain response time.";
  const sortedInterventionRows = [...interventionRows].sort((a, b) => {
    const aRank = a.criticalDelay ? 3 : a.overdue ? 2 : a.status !== "completed" ? 1 : 0;
    const bRank = b.criticalDelay ? 3 : b.overdue ? 2 : b.status !== "completed" ? 1 : 0;
    if (aRank !== bRank) return bRank - aRank;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  const serializedInterventionTasks = sortedInterventionRows.map((task) => ({
    id: task.id,
    studentName: task.studentName,
    examName: task.examName,
    marks: task.marks,
    recommendedModule: task.recommendedModule,
    status: task.status,
    ageDays: task.ageDays,
    overdue: task.overdue,
    criticalDelay: task.criticalDelay,
  }));

  const assignedTaskByResultId = new Map(
    recentInterventions.filter((task) => task.status === "assigned" && task.sourceResultId).map((task) => [task.sourceResultId!, task]),
  );
  const recentAuditLogs = await db.query.interventionAuditLogs.findMany({
    where: eq(interventionAuditLogs.schoolId, activeSchoolId),
    orderBy: [desc(interventionAuditLogs.createdAt)],
    limit: 8,
  });
  const digestRunLogs = await db.query.interventionAuditLogs.findMany({
    where: eq(interventionAuditLogs.schoolId, activeSchoolId),
    orderBy: [desc(interventionAuditLogs.createdAt)],
    limit: 30,
  });
  const digestRunHistory = digestRunLogs
    .filter((log) => log.actionType === "daily_digest_generate" || log.actionType === "daily_digest_generate_cron")
    .slice(0, 8)
    .map((log) => {
      const metadata = (log.metadata ?? {}) as Record<string, unknown>;
      const openCount = typeof metadata.openCount === "number" ? metadata.openCount : null;
      const overdueCount = typeof metadata.overdueCount === "number" ? metadata.overdueCount : null;
      const criticalCount = typeof metadata.criticalCount === "number" ? metadata.criticalCount : null;
      return {
        id: log.id,
        actionType: log.actionType,
        createdAt: log.createdAt,
        openCount,
        overdueCount,
        criticalCount,
      };
    });
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const recentDigestRuns = digestRunHistory.filter((run) => run.createdAt >= sevenDaysAgo);
  const manualDigestRuns7d = recentDigestRuns.filter((run) => run.actionType === "daily_digest_generate").length;
  const cronDigestRuns7d = recentDigestRuns.filter((run) => run.actionType === "daily_digest_generate_cron").length;
  const automationShare7d =
    recentDigestRuns.length > 0 ? Math.round((cronDigestRuns7d / recentDigestRuns.length) * 100) : 0;
  const automationStatus = automationShare7d >= 80 ? "strong" : automationShare7d >= 40 ? "partial" : "low";
  const latestCronRun = digestRunHistory.find((run) => run.actionType === "daily_digest_generate_cron") ?? null;
  const latestCronAgeHours = latestCronRun
    ? Math.floor((now.getTime() - latestCronRun.createdAt.getTime()) / (1000 * 60 * 60))
    : null;
  const cronDelayStatus =
    latestCronAgeHours === null ? "never" : latestCronAgeHours > 30 ? "delayed" : "on-time";
  const latestDigest = await db.query.interventionDailyDigests.findFirst({
    where: eq(interventionDailyDigests.schoolId, activeSchoolId),
    orderBy: [desc(interventionDailyDigests.createdAt)],
  });
  const digestFreshnessHours = latestDigest
    ? Math.floor((now.getTime() - latestDigest.updatedAt.getTime()) / (1000 * 60 * 60))
    : null;
  const digestFreshness =
    digestFreshnessHours === null ? "missing" : digestFreshnessHours > 30 ? "stale" : "fresh";

  const recentModuleEvents = await db.query.moduleHistories.findMany({
    where: eq(moduleHistories.schoolId, activeSchoolId),
    orderBy: [desc(moduleHistories.createdAt)],
    limit: 200,
  });

  const moduleTitleMap = new Map(allModules.map((m) => [m.slug, m.title]));
  const moduleSummary = new Map<
    string,
    {
      slug: string;
      title: string;
      attempts: number;
      lastActive: Date;
      scorePoints: number[];
    }
  >();

  for (const event of recentModuleEvents) {
    const key = event.moduleSlug;
    const current = moduleSummary.get(key) ?? {
      slug: key,
      title: moduleTitleMap.get(key) ?? event.moduleTitle ?? key,
      attempts: 0,
      lastActive: event.createdAt,
      scorePoints: [],
    };
    current.attempts += 1;
    if (event.createdAt > current.lastActive) current.lastActive = event.createdAt;

    if (event.outputData && typeof event.outputData === "object" && !Array.isArray(event.outputData)) {
      const output = event.outputData as Record<string, unknown>;
      const ratioScore = parseScoreRatio(output.score);
      const percentScore = parsePercent(output.accuracy);
      const scoreValue = ratioScore ?? percentScore;
      if (typeof scoreValue === "number") {
        current.scorePoints.push(scoreValue);
      }
    }

    moduleSummary.set(key, current);
  }

  const moduleRows = [...moduleSummary.values()]
    .map((row) => {
      const attempts = row.attempts;
      const avgScore =
        row.scorePoints.length > 0
          ? Math.round(row.scorePoints.reduce((sum, v) => sum + v, 0) / row.scorePoints.length)
          : null;
      const trend =
        row.scorePoints.length >= 2 ? row.scorePoints[row.scorePoints.length - 1]! - row.scorePoints[0]! : null;

      return {
        ...row,
        attempts,
        avgScore,
        trend,
      };
    })
    .sort((a, b) => b.attempts - a.attempts);

  const totalModuleAttempts = moduleRows.reduce((sum, row) => sum + row.attempts, 0);
  const activeModuleCount = moduleRows.length;
  const scoreRows = moduleRows.filter((row) => typeof row.avgScore === "number");
  const averageModuleScore =
    scoreRows.length > 0
      ? Math.round(scoreRows.reduce((sum, row) => sum + (row.avgScore ?? 0), 0) / scoreRows.length)
      : null;
  const improvingCount = moduleRows.filter((row) => typeof row.trend === "number" && row.trend > 0).length;
  const classAverageMarks =
    recentResults.length > 0
      ? Math.round(recentResults.reduce((sum, row) => sum + Number(row.marks ?? 0), 0) / recentResults.length)
      : null;
  const atRiskResultCount = recentResults.filter((row) => Number(row.marks ?? 0) < 40).length;

  const weakModuleSignals = moduleRows
    .filter((row) => (row.avgScore !== null && row.avgScore < 60) || (row.trend !== null && row.trend < 0))
    .map((row) => ({
      ...row,
      riskLevel:
        row.avgScore !== null && row.avgScore < 50 ? "high" : row.trend !== null && row.trend < -10 ? "high" : "medium",
      action: buildInterventionAction(row.title, row.avgScore, row.trend),
    }))
    .sort((a, b) => {
      const aRisk = a.riskLevel === "high" ? 2 : 1;
      const bRisk = b.riskLevel === "high" ? 2 : 1;
      if (aRisk !== bRisk) return bRisk - aRisk;
      return (a.avgScore ?? 100) - (b.avgScore ?? 100);
    });

  const completedInterventionCount = interventionRows.filter((t) => t.status === "completed").length;

  const chartPayload = buildSchoolChartsPayload({
    studentCount,
    examCount,
    resultCount,
    recentMarks: recentResults.map((r) => Number(r.marks ?? 0)),
    moduleRows: moduleRows.map((r) => ({ title: r.title, attempts: r.attempts })),
    openInterventionCount,
    overdueInterventionCount,
    completedInterventionCount,
    averageModuleScore,
    improvingCount,
    atRiskResultCount,
    moduleEventsForTrend: recentModuleEvents,
    now,
  });

  return (
    <div className="min-h-screen bg-[#0F172A] text-zinc-100">
      <DashboardDevSessionBanner
        show={showDevSessionBanner}
        session={session}
        schoolId={activeSchoolId}
        platformUserId={platformUserId}
        variant="school"
      />
      <header className="border-b border-slate-700/80 bg-[#1E293B]/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <Link
            href="/"
            className="text-sm font-medium text-slate-300 transition hover:text-white"
          >
            ← Home
          </Link>
          <PilotNav />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10 sm:py-14">
        <div className="mb-2 inline-flex items-center gap-2 text-emerald-400">
          <LayoutDashboard className="size-5" aria-hidden />
          <span className="text-xs font-semibold uppercase tracking-wider">School operations console</span>
        </div>
        {isMasterAdminSession(session) ? (
          <div className="mb-6 rounded-xl border border-amber-500/40 bg-amber-950/25 px-4 py-3 text-sm text-amber-100">
            <span className="font-semibold text-amber-200">Super Admin</span>
            <span className="text-amber-100/90">
              {" "}
              — you are viewing this tenant as platform operator
              {impersonatedTenantId ? (
                <span className="font-mono"> (impersonating {impersonatedTenantId})</span>
              ) : null}
              . Nationwide dashboard:{" "}
            </span>
            <Link href="/insights" className="font-semibold text-amber-300 underline">
              /insights
            </Link>
          </div>
        ) : null}
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">{school.name}</h1>
        <p className="mt-2 font-mono text-sm text-slate-400">UDISE {school.udiseCode}</p>
        <p className="mt-1 text-slate-400">
          {school.district} · {school.board}
        </p>

        <dl className="mt-8 grid grid-cols-3 gap-3 text-center sm:max-w-md sm:text-left">
          <div className="rounded-xl border border-slate-700 bg-[#1E293B] px-3 py-4">
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Students</dt>
            <dd className="mt-1 text-2xl font-semibold tabular-nums text-white">{studentCount}</dd>
          </div>
          <div className="rounded-xl border border-slate-700 bg-[#1E293B] px-3 py-4">
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Exams</dt>
            <dd className="mt-1 text-2xl font-semibold tabular-nums text-white">{examCount}</dd>
          </div>
          <div className="rounded-xl border border-slate-700 bg-[#1E293B] px-3 py-4">
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Results</dt>
            <dd className="mt-1 text-2xl font-semibold tabular-nums text-white">{resultCount}</dd>
          </div>
        </dl>

        <DashboardInsightCharts payload={chartPayload} />

        <section className="mt-8 rounded-xl border border-slate-700 bg-[#1E293B] p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-cyan-300">Export presets</h2>
          <p className="mt-1 text-xs text-slate-400">One-click bundles for weekly leadership review.</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <a href={trackerExport30dHref} className="rounded-lg border border-slate-600 px-3 py-2 text-xs text-slate-200 hover:border-cyan-500/50">
              Weekly tracker (last 30d)
            </a>
            <a href={auditExport30dHref} className="rounded-lg border border-slate-600 px-3 py-2 text-xs text-slate-200 hover:border-cyan-500/50">
              Weekly audit (last 30d)
            </a>
            <a href={trackerExportWeakArea30dHref} className="rounded-lg border border-slate-600 px-3 py-2 text-xs text-slate-200 hover:border-cyan-500/50">
              Weak Area Detection interventions
            </a>
            <a href={auditExportBulkFollowup30dHref} className="rounded-lg border border-slate-600 px-3 py-2 text-xs text-slate-200 hover:border-cyan-500/50">
              Bulk follow-up actions (last 30d)
            </a>
          </div>
        </section>

        <section className="mt-8 rounded-xl border border-slate-700 bg-[#1E293B] p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-emerald-300">Daily digest</h2>
              <p className="mt-1 text-xs text-slate-400">Generate and store daily intervention summary for operations review.</p>
            </div>
            <span
              className={`rounded-md border px-2 py-1 text-xs font-semibold ${
                digestFreshness === "fresh"
                  ? "border-emerald-500/40 text-emerald-300"
                  : digestFreshness === "stale"
                    ? "border-amber-500/40 text-amber-300"
                    : "border-rose-500/40 text-rose-300"
              }`}
            >
              Digest {digestFreshness === "fresh" ? "Fresh" : digestFreshness === "stale" ? "Stale" : "Missing"}
            </span>
            <form action={generateDailyInterventionDigest}>
              <button
                type="submit"
                className="rounded-md border border-emerald-500/40 px-3 py-1.5 text-xs font-semibold text-emerald-300"
              >
                Generate today&apos;s digest
              </button>
            </form>
          </div>
          <div className="mt-3 flex flex-wrap gap-3">
            <a href={digestExportAllHref} className="text-xs font-semibold text-cyan-300 hover:text-cyan-200">
              Download digest CSV (all)
            </a>
            <a href={digestExport30dHref} className="text-xs font-semibold text-cyan-300 hover:text-cyan-200">
              Download digest CSV (last 30d)
            </a>
          </div>
          {latestDigest ? (
            <div className="mt-3 rounded-lg border border-slate-700 bg-slate-900/40 p-3 text-xs text-slate-300">
              <p className="font-semibold text-white">Latest digest: {latestDigest.digestDate}</p>
              <p className="mt-1">
                Open: {String((latestDigest.summary as Record<string, unknown>).openCount ?? "--")} · Overdue:{" "}
                {String((latestDigest.summary as Record<string, unknown>).overdueCount ?? "--")} · Critical:{" "}
                {String((latestDigest.summary as Record<string, unknown>).criticalCount ?? "--")}
              </p>
              <p className="mt-1 text-slate-400">
                Freshness: {digestFreshnessHours ?? "--"} hour{digestFreshnessHours === 1 ? "" : "s"} since last update
              </p>
              <p className="mt-1 text-slate-400">
                Updated{" "}
                {latestDigest.updatedAt.toLocaleString(undefined, {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
            </div>
          ) : (
            <p className="mt-3 text-xs text-slate-400">No digest generated yet. Click generate to create today’s summary.</p>
          )}
        </section>

        <section className="mt-8 rounded-xl border border-slate-700 bg-[#1E293B] p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-cyan-300">Digest run history</h2>
          <div
            className={`mt-2 rounded-lg border px-3 py-2 text-xs ${
              automationStatus === "strong"
                ? "border-emerald-500/40 bg-emerald-950/20 text-emerald-200"
                : automationStatus === "partial"
                  ? "border-amber-500/40 bg-amber-950/20 text-amber-200"
                  : "border-rose-500/40 bg-rose-950/20 text-rose-200"
            }`}
          >
            Automation share (7d): {automationShare7d}%{" "}
            {automationStatus === "strong"
              ? "· Cron coverage is healthy."
              : automationStatus === "partial"
                ? "· Mix of manual and cron runs; increase scheduler reliability."
                : "· Mostly manual runs; validate DIGEST_CRON_TOKEN and scheduler setup."}
          </div>
          <div className="mt-2 rounded-lg border border-slate-700 bg-slate-900/40 px-3 py-2 text-xs text-slate-300">
            {latestCronRun ? (
              <>
                Last cron run:{" "}
                {latestCronRun.createdAt.toLocaleString(undefined, {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}{" "}
                · {latestCronAgeHours ?? "--"} hour{latestCronAgeHours === 1 ? "" : "s"} ago
              </>
            ) : (
              "Last cron run: not detected yet."
            )}
          </div>
          <div
            className={`mt-2 inline-flex rounded-md border px-2 py-1 text-xs font-semibold ${
              cronDelayStatus === "on-time"
                ? "border-emerald-500/40 text-emerald-300"
                : cronDelayStatus === "delayed"
                  ? "border-amber-500/40 text-amber-300"
                  : "border-rose-500/40 text-rose-300"
            }`}
          >
            Cron health:{" "}
            {cronDelayStatus === "on-time"
              ? "On-time"
              : cronDelayStatus === "delayed"
                ? "Delayed - check scheduler now"
                : "Never ran - configure cron"}
          </div>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            <div className="rounded-lg border border-slate-700 bg-slate-900/40 px-3 py-2 text-xs">
              <p className="text-slate-400">Runs last 7d</p>
              <p className="mt-1 font-semibold text-slate-100">{recentDigestRuns.length}</p>
            </div>
            <div className="rounded-lg border border-slate-700 bg-slate-900/40 px-3 py-2 text-xs">
              <p className="text-slate-400">Manual last 7d</p>
              <p className="mt-1 font-semibold text-amber-300">{manualDigestRuns7d}</p>
            </div>
            <div className="rounded-lg border border-slate-700 bg-slate-900/40 px-3 py-2 text-xs">
              <p className="text-slate-400">Cron last 7d</p>
              <p className="mt-1 font-semibold text-emerald-300">{cronDigestRuns7d}</p>
            </div>
          </div>
          {digestRunHistory.length === 0 ? (
            <p className="mt-2 text-xs text-slate-400">No digest run history yet.</p>
          ) : (
            <ul className="mt-3 divide-y divide-slate-700/70 rounded-lg border border-slate-700 bg-slate-900/40">
              {digestRunHistory.map((run) => (
                <li key={run.id} className="flex flex-col gap-1 px-3 py-2 text-xs sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium text-slate-100">{formatAuditAction(run.actionType)}</p>
                    <p className="text-slate-400">
                      {run.createdAt.toLocaleString(undefined, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                  </div>
                  <div className="text-slate-300">
                    Open {run.openCount ?? "--"} · Overdue {run.overdueCount ?? "--"} · Critical {run.criticalCount ?? "--"}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-8">
          <h2 className="text-lg font-semibold text-white">Module analytics</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-slate-700 bg-[#1E293B] px-3 py-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Attempts</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-white">{totalModuleAttempts}</p>
            </div>
            <div className="rounded-xl border border-slate-700 bg-[#1E293B] px-3 py-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Active modules</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-white">{activeModuleCount}</p>
            </div>
            <div className="rounded-xl border border-slate-700 bg-[#1E293B] px-3 py-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Avg score</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-emerald-400">
                {averageModuleScore !== null ? `${averageModuleScore}%` : "--"}
              </p>
            </div>
            <div className="rounded-xl border border-slate-700 bg-[#1E293B] px-3 py-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Improving modules</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-cyan-300">{improvingCount}</p>
            </div>
          </div>

          {moduleRows.length === 0 ? (
            <p className="mt-4 rounded-xl border border-dashed border-slate-600 bg-[#1E293B]/40 px-4 py-6 text-sm text-slate-400">
              No module activity yet. Once learners use modules, trend and score analytics will appear here.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-slate-700/80 rounded-xl border border-slate-700 bg-[#1E293B]">
              {moduleRows.slice(0, 8).map((row) => (
                <li key={row.slug} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-white">{row.title}</p>
                    <p className="text-xs text-slate-400">
                      {row.attempts} attempts · Last active{" "}
                      {row.lastActive.toLocaleString(undefined, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="rounded-md border border-slate-600 px-2 py-1 text-slate-300">
                      Avg: {row.avgScore !== null ? `${row.avgScore}%` : "--"}
                    </span>
                    <span
                      className={`rounded-md border px-2 py-1 ${
                        row.trend === null
                          ? "border-slate-600 text-slate-400"
                          : row.trend >= 0
                            ? "border-emerald-500/40 text-emerald-300"
                            : "border-rose-500/40 text-rose-300"
                      }`}
                    >
                      Trend:{" "}
                      {row.trend === null ? "--" : row.trend >= 0 ? `+${row.trend}%` : `${row.trend}%`}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-12">
          <h2 className="text-lg font-semibold text-white">Teacher insights</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-700 bg-[#1E293B] px-3 py-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Class average</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-white">
                {classAverageMarks !== null ? `${classAverageMarks}` : "--"}
              </p>
            </div>
            <div className="rounded-xl border border-slate-700 bg-[#1E293B] px-3 py-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">At-risk submissions</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-amber-300">{atRiskResultCount}</p>
            </div>
            <div className="rounded-xl border border-slate-700 bg-[#1E293B] px-3 py-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Weak module signals</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-rose-300">{weakModuleSignals.length}</p>
            </div>
          </div>

          {weakModuleSignals.length === 0 ? (
            <p className="mt-4 rounded-xl border border-dashed border-slate-600 bg-[#1E293B]/40 px-4 py-6 text-sm text-slate-400">
              No weak-topic signals detected right now. Continue monitoring module trend and exam outcomes weekly.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {weakModuleSignals.slice(0, 5).map((signal) => (
                <li key={signal.slug} className="rounded-xl border border-slate-700 bg-[#1E293B] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-white">{signal.title}</p>
                    <span
                      className={`rounded-md border px-2 py-1 text-xs font-medium ${
                        signal.riskLevel === "high"
                          ? "border-rose-500/40 text-rose-300"
                          : "border-amber-500/40 text-amber-300"
                      }`}
                    >
                      {signal.riskLevel === "high" ? "High Risk" : "Medium Risk"}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-slate-400">
                    Avg score: {signal.avgScore !== null ? `${signal.avgScore}%` : "--"} · Trend:{" "}
                    {signal.trend === null ? "--" : signal.trend >= 0 ? `+${signal.trend}%` : `${signal.trend}%`}
                  </p>
                  <p className="mt-2 text-sm text-cyan-200">{signal.action}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-12">
          <h2 className="text-lg font-semibold text-white">Student watchlist</h2>
          {watchlistRows.length === 0 ? (
            <p className="mt-3 rounded-xl border border-dashed border-slate-600 bg-[#1E293B]/40 px-4 py-6 text-sm text-slate-400">
              No at-risk students in recent submissions. Keep monitoring daily to catch sudden drops early.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {watchlistRows.map((row) => (
                <li key={row.id} className="rounded-xl border border-slate-700 bg-[#1E293B] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-white">{row.studentName}</p>
                    <span
                      className={`rounded-md border px-2 py-1 text-xs font-medium ${
                        row.riskBand === "Critical"
                          ? "border-rose-500/50 text-rose-300"
                          : row.riskBand === "High"
                            ? "border-amber-500/50 text-amber-300"
                            : "border-cyan-500/50 text-cyan-300"
                      }`}
                    >
                      {row.riskBand}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    {row.examName} · {row.marks} marks ·{" "}
                    {row.createdAt.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                  </p>
                  <p className="mt-2 text-sm text-cyan-200">Suggested assignment: {row.recommendedModule}</p>
                  <div className="mt-3">
                    {assignedTaskByResultId.get(row.sourceResultId) ? (
                      <span className="rounded-md border border-amber-500/40 px-2 py-1 text-xs text-amber-200">
                        Intervention assigned
                      </span>
                    ) : (
                      <form
                        action={assignIntervention.bind(null, {
                          sourceResultId: row.sourceResultId,
                          studentName: row.studentName,
                          examName: row.examName,
                          marks: row.marks,
                          recommendedModule: row.recommendedModule,
                        })}
                      >
                        <button
                          type="submit"
                          className="rounded-md border border-cyan-500/50 px-3 py-1.5 text-xs font-semibold text-cyan-200"
                        >
                          Mark as Assigned
                        </button>
                      </form>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <InterventionTrackerSection
          tasks={serializedInterventionTasks}
          slaStatus={slaStatus}
          slaMessage={slaMessage}
          overdueRate={overdueRate}
          criticalRate={criticalRate}
          openInterventionCount={openInterventionCount}
          overdueInterventionCount={overdueInterventionCount}
          criticalDelayCount={criticalDelayCount}
          trackerExportAllHref={trackerExportAllHref}
          trackerExport30dHref={trackerExport30dHref}
          trackerExportHomeworkHref={trackerExportHomeworkHref}
        />

        <section className="mt-12">
          <h2 className="text-lg font-semibold text-white">Intervention audit trail</h2>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <a
              href={auditExportAllHref}
              className="text-xs font-semibold text-cyan-300 hover:text-cyan-200"
            >
              Download audit CSV (all)
            </a>
            <a
              href={auditExport30dHref}
              className="text-xs font-semibold text-cyan-300 hover:text-cyan-200"
            >
              Download audit CSV (last 30d)
            </a>
            <a
              href={auditExportBulkCriticalHref}
              className="text-xs font-semibold text-cyan-300 hover:text-cyan-200"
            >
              Download audit CSV (bulk critical only)
            </a>
          </div>
          {recentAuditLogs.length === 0 ? (
            <p className="mt-3 rounded-xl border border-dashed border-slate-600 bg-[#1E293B]/40 px-4 py-6 text-sm text-slate-400">
              No intervention actions recorded yet.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-slate-700/80 rounded-xl border border-slate-700 bg-[#1E293B]">
              {recentAuditLogs.map((log) => (
                <li key={log.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-medium text-white">{formatAuditAction(log.actionType)}</p>
                    <p className="text-xs text-slate-400">
                      {log.createdAt.toLocaleString(undefined, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                  </div>
                  <div className="text-xs text-cyan-200">Affected: {log.affectedCount}</div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-12">
          <h2 className="text-lg font-semibold text-white">Recent results</h2>
          {recentResults.length === 0 ? (
            <p className="mt-3 rounded-xl border border-dashed border-slate-600 bg-[#1E293B]/40 px-4 py-8 text-center text-sm text-slate-400">
              No graded submissions yet. Run a scan from your classroom — marks saved here will appear in this list.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-slate-700/80 rounded-xl border border-slate-700 bg-[#1E293B]">
              {recentResults.map((r) => (
                <li
                  key={r.id}
                  className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-white">{r.studentName}</p>
                    <p className="truncate text-sm text-slate-400">{r.examName}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-4 text-sm">
                    <span className="tabular-nums font-semibold text-emerald-400">{r.marks} marks</span>
                    <time className="text-xs text-slate-500" dateTime={r.createdAt.toISOString()}>
                      {r.createdAt.toLocaleString(undefined, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </time>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <Link
            href="/scanner"
            className="group flex flex-col rounded-2xl border border-slate-600 bg-[#1E293B] p-6 transition hover:border-emerald-500/50 hover:bg-slate-800/80"
          >
            <ScanLine className="size-8 text-emerald-400" aria-hidden />
            <span className="mt-4 text-lg font-semibold text-white">Scan &amp; grade</span>
            <span className="mt-1 text-sm text-slate-400">Open the camera flow with your tenant session.</span>
            <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-emerald-400 group-hover:underline">
              Open <ExternalLink className="size-3.5" aria-hidden />
            </span>
          </Link>
          <Link
            href="/health"
            className="group flex flex-col rounded-2xl border border-slate-600 bg-[#1E293B] p-6 transition hover:border-emerald-500/50 hover:bg-slate-800/80"
          >
            <span className="text-2xl" aria-hidden>
              ✓
            </span>
            <span className="mt-4 text-lg font-semibold text-white">System health</span>
            <span className="mt-1 text-sm text-slate-400">
              Verify database, auth, Gemini, and Vision credentials.
            </span>
            <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-emerald-400 group-hover:underline">
              Open <ExternalLink className="size-3.5" aria-hidden />
            </span>
          </Link>
        </div>
      </main>
    </div>
  );
}
