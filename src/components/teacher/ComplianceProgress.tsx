"use client";

import { CheckCircle2, Clock, ShieldCheck, MessageCircle, Award } from "lucide-react";
import type { ComplianceSummary } from "@/src/app/actions/compliance";

const SUPPORT_WHATSAPP = "9535761292";

export function ComplianceProgress({ summary }: { summary: ComplianceSummary }) {
  const {
    totalHours,
    mandateHours,
    percentComplete,
    compliantSessions,
    totalSessions,
    readinessScore,
  } = summary;
  const isMet = percentComplete >= 100;

  return (
    <section className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-6 shadow-lg">
      <div className="flex items-center gap-2">
        <ShieldCheck className="size-5 text-teal-400" aria-hidden />
        <h2 className="text-sm font-semibold uppercase tracking-wide text-teal-200">
          Compliance Progress
        </h2>
      </div>
      <p className="mt-1 text-xs text-slate-500">CBSE 20-hour teaching mandate tracker</p>

      {/* Hour progress bar */}
      <div className="mt-5">
        <div className="flex items-end justify-between text-sm">
          <span className="font-medium text-slate-300">
            {totalHours} / {mandateHours} hours
          </span>
          <span
            className={`text-xs font-semibold ${isMet ? "text-emerald-400" : "text-amber-400"}`}
          >
            {percentComplete}%
          </span>
        </div>
        <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-slate-800">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isMet
                ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                : "bg-gradient-to-r from-amber-500 to-teal-400"
            }`}
            style={{ width: `${Math.min(percentComplete, 100)}%` }}
          />
        </div>
      </div>

      {/* Stat cards */}
      <div className="mt-5 grid grid-cols-3 gap-3">
        <StatCard
          icon={<Clock className="size-4 text-teal-400" />}
          label="Total sessions"
          value={String(totalSessions)}
        />
        <StatCard
          icon={<CheckCircle2 className="size-4 text-emerald-400" />}
          label="Compliant (≥70%)"
          value={String(compliantSessions)}
        />
        <StatCard
          icon={<Award className="size-4 text-amber-400" />}
          label="Readiness Score"
          value={`${readinessScore}%`}
          highlight={readinessScore >= 70}
        />
      </div>

      {/* Institutional Readiness Score detail */}
      <div className="mt-4 rounded-xl border border-slate-800/60 bg-slate-950/50 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="size-4 text-amber-400" aria-hidden />
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Institutional Readiness Score
            </span>
          </div>
          <span
            className={`text-lg font-bold ${
              readinessScore >= 70 ? "text-emerald-400" : "text-amber-400"
            }`}
          >
            {readinessScore}%
          </span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-800">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              readinessScore >= 70
                ? "bg-gradient-to-r from-emerald-500 to-emerald-400"
                : "bg-gradient-to-r from-amber-500 to-amber-400"
            }`}
            style={{ width: `${readinessScore}%` }}
          />
        </div>
        <p className="mt-2 text-[11px] text-slate-500">
          {compliantSessions} of {totalSessions} sessions scored ≥70% mastery
          {readinessScore >= 70
            ? " — institution is on track"
            : " — more compliant sessions needed"}
        </p>
      </div>

      {isMet && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-950/40 px-3 py-2">
          <ShieldCheck className="size-4 text-emerald-400" aria-hidden />
          <p className="text-xs font-medium text-emerald-200">
            20-hour mandate fulfilled — great work!
          </p>
        </div>
      )}

      {/* WhatsApp Support — prominent placement */}
      <div className="mt-5 flex items-center justify-between rounded-xl border border-green-500/30 bg-green-950/30 px-4 py-3">
        <div>
          <p className="text-xs font-semibold text-green-200">Need help with compliance?</p>
          <p className="mt-0.5 text-[11px] text-green-300/70">
            Reach our support team on WhatsApp
          </p>
        </div>
        <a
          href={`https://wa.me/91${SUPPORT_WHATSAPP}`}
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

function StatCard({
  icon,
  label,
  value,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-800/60 bg-slate-950/50 px-3 py-3">
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="text-[11px] text-slate-500">{label}</span>
      </div>
      <p
        className={`mt-1 text-lg font-bold ${highlight ? "text-emerald-400" : "text-white"}`}
      >
        {value}
      </p>
    </div>
  );
}
