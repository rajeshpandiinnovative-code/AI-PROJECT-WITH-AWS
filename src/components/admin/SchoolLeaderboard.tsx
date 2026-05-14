"use client";

import { useCallback, useState, useTransition } from "react";
import {
  ShieldCheck,
  Trophy,
  Clock,
  Award,
  MessageCircle,
  FileDown,
  Users,
  X,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Target,
  Eye,
} from "lucide-react";
import type { SchoolComplianceMetrics, TopTeacher, ComplianceSummary } from "@/src/app/actions/compliance";
import { getTeacherComplianceDetail } from "@/src/app/actions/compliance";

const SUPPORT_WHATSAPP = "9535761292";
const TOAST_DURATION_MS = 5000;
const GOVT_MANDATE_HOURS = 20;

type Toast = { id: number; type: "success" | "info"; message: string };

type TeacherDetail = ComplianceSummary & { displayName: string };

export function SchoolLeaderboard({
  metrics,
  schoolName,
}: {
  metrics: SchoolComplianceMetrics | null;
  schoolName?: string;
}) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [toastCounter, setToastCounter] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [drillDown, setDrillDown] = useState<TeacherDetail | null>(null);
  const [drillDownLoading, startDrillDown] = useTransition();

  const pushToast = useCallback(
    (type: "success" | "info", message: string) => {
      const id = toastCounter + 1;
      setToastCounter(id);
      setToasts((prev) => [...prev, { id, type, message }]);
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), TOAST_DURATION_MS);
    },
    [toastCounter],
  );

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleExport = useCallback(() => {
    setExporting(true);
    pushToast("info", "Generating PDF Report for Board Meeting…");
    setTimeout(() => {
      setExporting(false);
      pushToast("success", "Report generation queued — PDF export will be available in the next sprint release.");
    }, 3000);
  }, [pushToast]);

  const handleTeacherClick = useCallback(
    (teacherId: string) => {
      startDrillDown(async () => {
        const result = await getTeacherComplianceDetail(teacherId);
        if (result.success) {
          setDrillDown(result.data);
        } else {
          pushToast("info", result.error);
        }
      });
    },
    [pushToast],
  );

  const waText = encodeURIComponent(
    `Hi, I am from ${schoolName || "our school"}, I need assistance with the AI Academy Dashboard.`,
  );
  const waHref = `https://wa.me/91${SUPPORT_WHATSAPP}?text=${waText}`;

  if (!metrics) {
    return <LeaderboardSkeleton />;
  }

  const { totalSchoolHours, totalSessions, overallReadinessScore, topTeachers } = metrics;

  const institutionalPercent =
    GOVT_MANDATE_HOURS > 0 ? Math.min(100, Math.round((totalSchoolHours / GOVT_MANDATE_HOURS) * 100)) : 0;

  const readinessColor =
    overallReadinessScore >= 70
      ? "text-emerald-400"
      : overallReadinessScore >= 50
        ? "text-amber-400"
        : "text-red-400";

  const highPerforming = topTeachers.filter((t) => t.percentToMandate >= 100);
  const requiresIntervention = topTeachers.filter((t) => t.percentToMandate < 100);

  return (
    <section className="space-y-5 font-sans">
      {/* Toast stack */}
      {toasts.length > 0 && (
        <div className="fixed right-4 top-4 z-50 flex flex-col gap-2">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`flex items-start gap-2 rounded-lg border px-4 py-3 text-sm shadow-lg backdrop-blur ${
                t.type === "success"
                  ? "border-emerald-500/40 bg-emerald-950/90 text-emerald-100"
                  : "border-teal-500/40 bg-teal-950/90 text-teal-100"
              }`}
            >
              {t.type === "success" ? (
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-400" />
              ) : (
                <Loader2 className="mt-0.5 size-4 shrink-0 animate-spin text-teal-400" />
              )}
              <p className="max-w-xs">{t.message}</p>
              <button onClick={() => dismissToast(t.id)} className="ml-2 shrink-0 text-slate-400 hover:text-white">
                <X className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
         CEO VIEW — The Compliance Shield
         ═══════════════════════════════════════════════════════════════════════ */}
      <div className="rounded-2xl border border-slate-800/80 bg-gradient-to-br from-slate-900/90 to-slate-950 p-6 shadow-xl shadow-black/20">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-teal-400" aria-hidden />
            <h2 className="font-sans text-sm font-semibold uppercase tracking-wide text-teal-200">
              Institutional Management
            </h2>
          </div>
          <button
            type="button"
            disabled={exporting}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-teal-500/40 hover:text-white disabled:opacity-50"
            onClick={handleExport}
          >
            {exporting ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
            ) : (
              <FileDown className="size-3.5" aria-hidden />
            )}
            {exporting ? "Generating…" : "Quick Export"}
          </button>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Dual-perspective executive dashboard for CEO and Principal review
        </p>

        {/* KPI Cards */}
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <KpiCard
            icon={<Clock className="size-5 text-teal-400" />}
            label="Total Institutional Hours"
            value={`${totalSchoolHours}h`}
            detail={`${totalSessions} sessions logged`}
          />
          <KpiCard
            icon={<Users className="size-5 text-indigo-400" />}
            label="Active Teachers"
            value={String(topTeachers.length)}
            detail="Teachers with logged sessions"
          />
          <KpiCard
            icon={<Award className="size-5 text-amber-400" />}
            label="Overall Readiness Score"
            value={totalSessions > 0 ? `${overallReadinessScore}%` : "N/A"}
            detail="Regulatory Compliance Health (June 2026 Mandate)"
            valueColor={totalSessions > 0 ? readinessColor : "text-slate-500"}
          />
        </div>

        {/* Government Mandate Progress Indicator */}
        <div className="mt-6 rounded-xl border border-slate-800/60 bg-slate-950/50 px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="size-4 text-teal-400" aria-hidden />
              <span className="font-sans text-xs font-semibold uppercase tracking-wide text-slate-400">
                Government Mandate Progress
              </span>
            </div>
            <span className={`text-sm font-bold ${institutionalPercent >= 100 ? "text-emerald-400" : "text-amber-400"}`}>
              {totalSchoolHours}h / {GOVT_MANDATE_HOURS}h
            </span>
          </div>
          <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                institutionalPercent >= 100
                  ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                  : institutionalPercent >= 50
                    ? "bg-gradient-to-r from-amber-500 to-teal-400"
                    : "bg-gradient-to-r from-red-500 to-amber-500"
              }`}
              style={{ width: `${institutionalPercent}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
            <span>
              {institutionalPercent >= 100
                ? "Mandate fulfilled — institution is compliant"
                : `${100 - institutionalPercent}% remaining to meet June 2026 requirement`}
            </span>
            <span className={`font-semibold ${institutionalPercent >= 100 ? "text-emerald-400" : "text-amber-400"}`}>
              {institutionalPercent}%
            </span>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
         PRINCIPAL VIEW — The Academic Sword (Instructional Leaderboard)
         ═══════════════════════════════════════════════════════════════════════ */}
      <div className="rounded-2xl border border-slate-800/80 bg-gradient-to-br from-slate-900/90 to-slate-950 shadow-xl shadow-black/20">
        <div className="border-b border-slate-800/80 px-6 py-5">
          <div className="flex items-center gap-2">
            <Trophy className="size-5 text-amber-400" aria-hidden />
            <h3 className="font-sans text-sm font-semibold uppercase tracking-wide text-amber-200">
              Instructional Leaderboard
            </h3>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Instructional output ranked by hours toward the 20-hour CBSE mandate
          </p>
        </div>

        {topTeachers.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="text-sm text-slate-500">
              No teaching sessions logged yet. Compliance data will appear once teachers start logging.
            </p>
          </div>
        ) : (
          <div>
            {/* High Performing Section */}
            {highPerforming.length > 0 && (
              <div>
                <div className="flex items-center gap-2 border-b border-emerald-500/20 bg-emerald-950/20 px-6 py-2.5">
                  <CheckCircle2 className="size-3.5 text-emerald-400" aria-hidden />
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-300">
                    High Performing — Milestone Reached
                  </span>
                </div>
                <div className="divide-y divide-slate-800/60">
                  {highPerforming.map((teacher, idx) => (
                    <TeacherRow key={teacher.teacherId} teacher={teacher} rank={idx + 1} onClickName={handleTeacherClick} />
                  ))}
                </div>
              </div>
            )}

            {/* Requires Intervention Section */}
            {requiresIntervention.length > 0 && (
              <div>
                <div className="flex items-center gap-2 border-b border-amber-500/20 bg-amber-950/20 px-6 py-2.5">
                  <AlertTriangle className="size-3.5 text-amber-400" aria-hidden />
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-300">
                    Requires Intervention — Below 20-Hour Milestone
                  </span>
                </div>
                <div className="divide-y divide-slate-800/60">
                  {requiresIntervention.map((teacher, idx) => (
                    <TeacherRow
                      key={teacher.teacherId}
                      teacher={teacher}
                      rank={highPerforming.length + idx + 1}
                      onClickName={handleTeacherClick}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Teacher Performance Detail — Drill-Down Panel */}
      {(drillDown || drillDownLoading) && (
        <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/40 to-slate-950 p-6 shadow-xl shadow-black/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="size-5 text-indigo-400" aria-hidden />
              <h3 className="font-sans text-sm font-semibold uppercase tracking-wide text-indigo-200">
                Teacher Performance Detail
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setDrillDown(null)}
              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white"
            >
              <X className="size-4" />
            </button>
          </div>

          {drillDownLoading && !drillDown ? (
            <div className="mt-6 flex items-center justify-center gap-2 py-8">
              <Loader2 className="size-5 animate-spin text-indigo-400" />
              <span className="text-sm text-slate-400">Loading teacher data…</span>
            </div>
          ) : drillDown ? (
            <div className="mt-5 space-y-4">
              <p className="text-lg font-bold text-white">{drillDown.displayName}</p>

              <div className="grid gap-3 sm:grid-cols-4">
                <DetailStat label="Hours Logged" value={`${drillDown.totalHours}h`} />
                <DetailStat label="Mandate Target" value={`${drillDown.mandateHours}h`} />
                <DetailStat label="Progress" value={`${drillDown.percentComplete}%`} highlight={drillDown.percentComplete >= 100} />
                <DetailStat label="Readiness Score" value={`${drillDown.readinessScore}%`} highlight={drillDown.readinessScore >= 70} />
              </div>

              <div>
                <div className="flex items-end justify-between text-xs">
                  <span className="font-medium text-slate-300">
                    {drillDown.totalHours}h / {drillDown.mandateHours}h mandate
                  </span>
                  <span className={`font-semibold ${drillDown.percentComplete >= 100 ? "text-emerald-400" : "text-amber-400"}`}>
                    {drillDown.percentComplete}%
                  </span>
                </div>
                <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-slate-800">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      drillDown.percentComplete >= 100
                        ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                        : drillDown.percentComplete >= 50
                          ? "bg-gradient-to-r from-amber-500 to-teal-400"
                          : "bg-gradient-to-r from-red-500 to-amber-500"
                    }`}
                    style={{ width: `${Math.min(drillDown.percentComplete, 100)}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-400">
                <span>{drillDown.totalSessions} total sessions</span>
                <span>{drillDown.compliantSessions} compliant (score ≥70%)</span>
                <span
                  className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase ${
                    drillDown.percentComplete >= 100
                      ? "border-emerald-500/30 bg-emerald-950/40 text-emerald-300"
                      : "border-amber-500/30 bg-amber-950/40 text-amber-300"
                  }`}
                >
                  {drillDown.percentComplete >= 100 ? "High Performing" : "Requires Intervention"}
                </span>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* WhatsApp Support */}
      <div className="flex items-center justify-between rounded-2xl border border-green-500/25 bg-green-950/25 px-6 py-4">
        <div>
          <p className="text-xs font-semibold text-green-200">Leadership support line</p>
          <p className="mt-0.5 text-[11px] text-green-300/70">
            For compliance queries or report requests
          </p>
        </div>
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-xs font-semibold text-white shadow transition hover:bg-green-500"
        >
          <MessageCircle className="size-4" aria-hidden />
          {SUPPORT_WHATSAPP}
        </a>
      </div>
    </section>
  );
}

/** Pulsing skeleton shown while RDS data is loading */
function LeaderboardSkeleton() {
  return (
    <section className="space-y-5 animate-pulse font-sans" aria-label="Loading compliance dashboard">
      <div className="rounded-2xl border border-slate-800/80 bg-gradient-to-br from-slate-900/90 to-slate-950 p-6 shadow-xl shadow-black/20">
        <div className="flex items-center gap-2">
          <div className="size-5 rounded bg-slate-800" />
          <div className="h-4 w-48 rounded bg-slate-800" />
        </div>
        <div className="mt-1 h-3 w-64 rounded bg-slate-800/60" />
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-slate-800/60 bg-slate-950/50 px-4 py-4">
              <div className="h-3 w-24 rounded bg-slate-800" />
              <div className="mt-3 h-8 w-20 rounded bg-slate-800" />
              <div className="mt-2 h-3 w-32 rounded bg-slate-800/60" />
            </div>
          ))}
        </div>
        <div className="mt-6 rounded-xl border border-slate-800/60 bg-slate-950/50 px-5 py-4">
          <div className="h-3 w-48 rounded bg-slate-800" />
          <div className="mt-3 h-3 w-full rounded-full bg-slate-800" />
        </div>
        <p className="mt-4 text-center text-xs text-slate-600">Syncing with AWS…</p>
      </div>

      <div className="rounded-2xl border border-slate-800/80 bg-gradient-to-br from-slate-900/90 to-slate-950 shadow-xl shadow-black/20">
        <div className="border-b border-slate-800/80 px-6 py-5">
          <div className="h-4 w-40 rounded bg-slate-800" />
          <div className="mt-2 h-3 w-56 rounded bg-slate-800/60" />
        </div>
        <div className="divide-y divide-slate-800/60">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4 px-6 py-4">
              <div className="size-8 rounded-full bg-slate-800" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 rounded bg-slate-800" />
                <div className="h-2 w-full rounded-full bg-slate-800" />
              </div>
            </div>
          ))}
        </div>
        <p className="border-t border-slate-800/60 px-6 py-3 text-center text-xs text-slate-600">
          Syncing with AWS…
        </p>
      </div>
    </section>
  );
}

function TeacherRow({ teacher, rank, onClickName }: { teacher: TopTeacher; rank: number; onClickName?: (id: string) => void }) {
  return (
    <div className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <RankBadge rank={rank} />
        <div>
          <button
            type="button"
            onClick={() => onClickName?.(teacher.teacherId)}
            className="font-sans font-semibold text-white underline decoration-slate-600 underline-offset-2 transition hover:text-teal-300 hover:decoration-teal-400"
          >
            {teacher.displayName}
          </button>
          <p className="text-xs text-slate-500">
            {teacher.totalSessions} sessions · {teacher.compliantSessions} compliant
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4 sm:min-w-[280px]">
        <div className="flex-1">
          <div className="flex items-end justify-between text-xs">
            <span className="font-medium text-slate-300">
              {teacher.totalHours}h / {GOVT_MANDATE_HOURS}h
            </span>
            <span
              className={`font-semibold ${
                teacher.percentToMandate >= 100
                  ? "text-emerald-400"
                  : teacher.percentToMandate >= 50
                    ? "text-amber-400"
                    : "text-red-400"
              }`}
            >
              {teacher.percentToMandate}%
            </span>
          </div>
          <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                teacher.percentToMandate >= 100
                  ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                  : teacher.percentToMandate >= 50
                    ? "bg-gradient-to-r from-amber-500 to-teal-400"
                    : "bg-gradient-to-r from-red-500 to-amber-500"
              }`}
              style={{ width: `${Math.min(teacher.percentToMandate, 100)}%` }}
            />
          </div>
        </div>
        <span
          className={`shrink-0 rounded-md border px-2 py-1 text-[10px] font-semibold uppercase ${
            teacher.percentToMandate >= 100
              ? "border-emerald-500/30 bg-emerald-950/40 text-emerald-300"
              : "border-amber-500/30 bg-amber-950/40 text-amber-300"
          }`}
        >
          {teacher.percentToMandate >= 100 ? "High Performing" : "Requires Intervention"}
        </span>
      </div>
    </div>
  );
}

function KpiCard({
  icon,
  label,
  value,
  detail,
  valueColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
  valueColor?: string;
}) {
  return (
    <article className="rounded-xl border border-slate-800/60 bg-slate-950/50 px-4 py-4">
      <div className="flex items-center gap-2">
        {icon}
        <span className="font-sans text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          {label}
        </span>
      </div>
      <p className={`mt-2 text-3xl font-bold tabular-nums tracking-tight ${valueColor ?? "text-white"}`}>
        {value}
      </p>
      <p className="mt-1 text-xs text-slate-500">{detail}</p>
    </article>
  );
}

function RankBadge({ rank }: { rank: number }) {
  const colors =
    rank === 1
      ? "border-amber-400/40 bg-amber-950/50 text-amber-300"
      : rank === 2
        ? "border-slate-400/30 bg-slate-800/50 text-slate-300"
        : "border-orange-400/30 bg-orange-950/40 text-orange-300";
  return (
    <span
      className={`inline-flex size-8 shrink-0 items-center justify-center rounded-full border text-sm font-bold ${colors}`}
    >
      {rank}
    </span>
  );
}

function DetailStat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-lg border border-slate-800/60 bg-slate-950/50 px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 text-xl font-bold tabular-nums ${highlight ? "text-emerald-400" : "text-white"}`}>
        {value}
      </p>
    </div>
  );
}
