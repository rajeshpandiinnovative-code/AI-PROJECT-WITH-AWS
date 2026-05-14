"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Clock, ShieldCheck, MessageCircle, Award, X, AlertTriangle } from "lucide-react";
import type { ComplianceSummary, LogLessonResult } from "@/src/app/actions/compliance";
import { logLessonSession } from "@/src/app/actions/compliance";

const SUPPORT_WHATSAPP = "9535761292";
const TOAST_DURATION_MS = 5000;

type Toast = { id: number; type: "success" | "error"; message: string };

export function ComplianceProgress({
  summary: initialSummary,
  students,
  schoolName,
}: {
  summary: ComplianceSummary;
  students?: { id: string; name: string }[];
  schoolName?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [summary, setSummary] = useState(initialSummary);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [toastCounter, setToastCounter] = useState(0);

  const pushToast = useCallback(
    (type: "success" | "error", message: string) => {
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

  const handleLogSession = useCallback(
    async (formData: FormData) => {
      const studentId = formData.get("studentId") as string;
      const cbseSkillCode = formData.get("cbseSkillCode") as string;
      const sessionDuration = Number(formData.get("sessionDuration"));
      const masteryScore = Number(formData.get("masteryScore"));

      if (!studentId || !cbseSkillCode || !sessionDuration || isNaN(masteryScore)) {
        pushToast("error", "Please fill all required fields");
        return;
      }

      const result: LogLessonResult = await logLessonSession({
        studentId,
        cbseSkillCode,
        sessionDuration,
        masteryScore,
      });

      if (!result.success) {
        pushToast("error", result.error);
        return;
      }

      const isCompliant = result.isCompliant;
      setSummary((prev) => {
        const newTotal = prev.totalSessions + 1;
        const newCompliant = prev.compliantSessions + (isCompliant ? 1 : 0);
        const newMinutes = prev.totalMinutes + sessionDuration;
        const newHours = newMinutes / 60;
        return {
          ...prev,
          totalMinutes: newMinutes,
          totalHours: Math.round(newHours * 10) / 10,
          percentComplete: Math.min(100, Math.round((newHours / prev.mandateHours) * 100)),
          totalSessions: newTotal,
          compliantSessions: newCompliant,
          readinessScore: newTotal > 0 ? Math.round((newCompliant / newTotal) * 100) : 0,
        };
      });

      pushToast(
        "success",
        isCompliant
          ? "Session logged successfully — Compliant (score ≥70%)"
          : "Session logged successfully — Non-compliant (score <70%)",
      );

      startTransition(() => router.refresh());
    },
    [pushToast, router, startTransition],
  );

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
    <section id="compliance" className="scroll-mt-24 space-y-5 font-sans">
      {/* Toast stack */}
      {toasts.length > 0 && (
        <div className="fixed right-4 top-4 z-50 flex flex-col gap-2">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`flex items-start gap-2 rounded-lg border px-4 py-3 text-sm shadow-lg backdrop-blur animate-in slide-in-from-right ${
                t.type === "success"
                  ? "border-emerald-500/40 bg-emerald-950/90 text-emerald-100"
                  : "border-red-500/40 bg-red-950/90 text-red-100"
              }`}
            >
              {t.type === "success" ? (
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-400" />
              ) : (
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-red-400" />
              )}
              <p className="max-w-xs">{t.message}</p>
              <button onClick={() => dismissToast(t.id)} className="ml-2 shrink-0 text-slate-400 hover:text-white">
                <X className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Dashboard card */}
      <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-6 shadow-lg">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-5 text-teal-400" aria-hidden />
          <h2 className="font-sans text-sm font-semibold uppercase tracking-wide text-teal-200">
            Compliance Progress
          </h2>
          {isPending && (
            <span className="ml-auto text-[10px] text-slate-500 animate-pulse">syncing…</span>
          )}
        </div>
        <p className="mt-1 text-xs text-slate-500">CBSE 20-hour teaching mandate tracker</p>

        {/* Hour progress bar */}
        <div className="mt-5">
          <div className="flex items-end justify-between text-sm">
            <span className="font-medium text-slate-300">
              {totalHours} / {mandateHours} hours
            </span>
            <span className={`text-xs font-semibold ${isMet ? "text-emerald-400" : "text-amber-400"}`}>
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
              className={`text-lg font-bold transition-colors duration-300 ${
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
            href={`https://wa.me/91${SUPPORT_WHATSAPP}?text=${encodeURIComponent(`Hi, I am from ${schoolName || "our school"}, I need assistance with the AI Academy Dashboard.`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-xs font-semibold text-white shadow transition hover:bg-green-500"
          >
            <MessageCircle className="size-4" aria-hidden />
            {SUPPORT_WHATSAPP}
          </a>
        </div>
      </div>

      {/* Quick-log form */}
      {students && students.length > 0 && (
        <details className="group rounded-2xl border border-slate-800/80 bg-slate-900/60 shadow-lg">
          <summary className="cursor-pointer px-6 py-4 text-sm font-semibold text-teal-200 group-open:border-b group-open:border-slate-800/60">
            + Log a teaching session
          </summary>
          <form action={handleLogSession} className="space-y-4 px-6 py-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-xs text-slate-400">Student</span>
                <select
                  name="studentId"
                  required
                  className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-teal-500 focus:outline-none"
                >
                  <option value="">Select student…</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-xs text-slate-400">CBSE Skill Code</span>
                <input
                  name="cbseSkillCode"
                  required
                  placeholder="e.g. CBSE-MATH-6.1"
                  className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-teal-500 focus:outline-none"
                />
              </label>
              <label className="block">
                <span className="text-xs text-slate-400">Session Duration (1–300 min)</span>
                <input
                  name="sessionDuration"
                  type="number"
                  required
                  min={1}
                  max={300}
                  placeholder="e.g. 45"
                  className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-teal-500 focus:outline-none"
                />
              </label>
              <label className="block">
                <span className="text-xs text-slate-400">Mastery Score (0–100)</span>
                <input
                  name="masteryScore"
                  type="number"
                  required
                  min={0}
                  max={100}
                  step="0.1"
                  placeholder="e.g. 85"
                  className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-teal-500 focus:outline-none"
                />
              </label>
            </div>
            <button
              type="submit"
              className="rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-teal-500 disabled:opacity-50"
            >
              Log Session
            </button>
          </form>
        </details>
      )}
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
      <p className={`mt-1 text-lg font-bold transition-all duration-300 ${highlight ? "text-emerald-400" : "text-white"}`}>
        {value}
      </p>
    </div>
  );
}
