"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type FinancialPoint = {
  month: string;
  collected: number;
  target: number;
};

export function CorrespondentExecutiveDashboard({
  feeCollectionPercent,
  papersThisWeek,
  financialSeries,
  teacherAudience,
}: {
  feeCollectionPercent: number;
  papersThisWeek: number;
  financialSeries: FinancialPoint[];
  teacherAudience: number;
}) {
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [sendStatus, setSendStatus] = useState<"idle" | "sent">("idle");

  const clampedFeePercent = Math.max(0, Math.min(100, Math.round(feeCollectionPercent)));
  const efficiencyCopy = useMemo(() => {
    const hoursSaved = Math.round((papersThisWeek * 6) / 60);
    return `${papersThisWeek.toLocaleString("en-IN")} papers graded this week - ${hoursSaved} teacher hours saved.`;
  }, [papersThisWeek]);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-amber-400/30 bg-gradient-to-br from-[#0B1B3A] via-[#0C234A] to-[#142F64] p-5 shadow-[0_24px_80px_-30px_rgba(15,23,42,0.9)]">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-300">Executive Dashboard</p>
        <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">Decisions based on Data, not Guesswork.</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <ExecStat title="Total Enrollment (Real-time)" value="Live" helper="Auto-updates from student records" />
          <ExecStat title="Fee Collection Status" value={`${clampedFeePercent}%`} helper="Current term progress" />
          <ExecStat title="AI Efficiency" value="Operational" helper={efficiencyCopy} />
        </div>
        <div className="mt-4">
          <div className="h-3 w-full overflow-hidden rounded-full bg-blue-950/70">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-300 transition-all"
              style={{ width: `${clampedFeePercent}%` }}
            />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-blue-800/60 bg-[#0A1A35] p-5">
        <h3 className="text-lg font-semibold text-white">Three Pillars of the Platform</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-blue-200/90">
              <tr>
                <th className="px-3 py-2">Pillar</th>
                <th className="px-3 py-2">Benefit for Management</th>
                <th className="px-3 py-2">The Wow Factor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-900/60 text-slate-200">
              <tr>
                <td className="px-3 py-3 font-semibold text-amber-300">AI Assessment</td>
                <td className="px-3 py-3">Eliminate grading delays and human bias.</td>
                <td className="px-3 py-3">OCR scans handwritten Tamil/English and gives marks in seconds.</td>
              </tr>
              <tr>
                <td className="px-3 py-3 font-semibold text-amber-300">Financial Pulse</td>
                <td className="px-3 py-3">Stop chasing late fees manually.</td>
                <td className="px-3 py-3">Automated WhatsApp reminders with a UPI payment link.</td>
              </tr>
              <tr>
                <td className="px-3 py-3 font-semibold text-amber-300">Campus Security</td>
                <td className="px-3 py-3">Track attendance and entry effortlessly.</td>
                <td className="px-3 py-3">Mobile OTP login for staff - no lost passwords or fake entries.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-blue-800/60 bg-[#0A1A35] p-5 lg:col-span-2">
          <h3 className="text-lg font-semibold text-white">Financial Health</h3>
          <p className="mt-1 text-xs text-blue-200/80">Month-on-month fee collections vs target</p>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={financialSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e3a8a" />
                <XAxis dataKey="month" tick={{ fill: "#bfdbfe", fontSize: 11 }} />
                <YAxis tick={{ fill: "#bfdbfe", fontSize: 11 }} />
                <Tooltip contentStyle={{ background: "#0b1730", border: "1px solid #1e3a8a" }} />
                <Bar dataKey="target" fill="#1d4ed8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="collected" fill="#fbbf24" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-4">
          <section className="rounded-2xl border border-blue-800/60 bg-[#0A1A35] p-5">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-amber-300">Local School Alerts</h4>
            <ul className="mt-3 space-y-2 text-xs text-slate-200">
              <li>Board Exam prep modules updated for TN State Syllabus.</li>
              <li>Fee due reminder template refreshed for Srivilliputhur schools.</li>
              <li>New teacher verified via OTP at VPMM Group.</li>
            </ul>
          </section>

          <section className="rounded-2xl border border-amber-400/35 bg-[#0A1A35] p-5">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-amber-300">One-Click Broadcast</h4>
            <textarea
              value={broadcastMessage}
              onChange={(e) => {
                setBroadcastMessage(e.target.value);
                if (sendStatus !== "idle") setSendStatus("idle");
              }}
              placeholder="Type a message to all teachers..."
              className="mt-3 h-24 w-full rounded-md border border-blue-700 bg-[#08162e] px-3 py-2 text-sm text-white outline-none focus:border-amber-400"
            />
            <button
              type="button"
              onClick={() => {
                if (!broadcastMessage.trim()) return;
                setSendStatus("sent");
              }}
              className="mt-3 w-full rounded-md bg-amber-400 px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-300"
            >
              Send to {teacherAudience >= 50 ? "50+" : teacherAudience} teachers
            </button>
            {sendStatus === "sent" ? (
              <p className="mt-2 text-xs text-emerald-300">Broadcast queued successfully.</p>
            ) : null}
          </section>
        </div>
      </section>

      <section className="rounded-2xl border border-blue-800/60 bg-[#0A1A35] p-5">
        <p className="text-sm text-blue-100">Built for Srivilliputhur, Scalable for India.</p>
        <div className="mt-3 inline-flex rounded-full border border-amber-300/50 bg-amber-300/10 px-3 py-1 text-xs text-amber-200">
          Proudly Developed by Pinnacle Software Solution
        </div>
        <div className="mt-4">
          <a
            href="https://wa.me/919535761292?text=Hi%20Rajesh%2C%20I%20want%20a%20live%20campus%20demo."
            target="_blank"
            rel="noreferrer"
            className="inline-flex rounded-md bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-300"
          >
            Schedule a Live Demo at Your Campus
          </a>
        </div>
      </section>
    </div>
  );
}

function ExecStat({
  title,
  value,
  helper,
}: {
  title: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="rounded-xl border border-blue-700/50 bg-[#091a35]/80 p-3">
      <p className="text-[11px] uppercase tracking-wide text-blue-200/90">{title}</p>
      <p className="mt-1 text-xl font-bold text-amber-300">{value}</p>
      <p className="mt-1 text-xs text-slate-300">{helper}</p>
    </div>
  );
}
