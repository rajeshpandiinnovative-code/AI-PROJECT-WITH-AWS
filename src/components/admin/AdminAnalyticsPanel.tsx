"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type SeriesPoint = { label: string; value: number };

export function AdminAnalyticsPanel({
  gradedSeries,
  tokenUsagePercent,
  tokenCostInr,
}: {
  gradedSeries: SeriesPoint[];
  tokenUsagePercent: number;
  tokenCostInr: number;
}) {
  const gauge = [{ name: "AI token usage", value: Math.max(0, Math.min(100, tokenUsagePercent)), fill: "#22d3ee" }];

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
        <h3 className="text-sm font-semibold text-white">Total Papers Graded via OCR</h3>
        <p className="mt-1 text-xs text-slate-400">Last 14 days</p>
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={gradedSeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="label" tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155" }} />
              <Line type="monotone" dataKey="value" stroke="#22d3ee" strokeWidth={2.5} dot={{ r: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
        <h3 className="text-sm font-semibold text-white">AI Token Usage / Cost</h3>
        <p className="mt-1 text-xs text-slate-400">Usage gauge with estimated monthly cost</p>
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              innerRadius="65%"
              outerRadius="100%"
              data={gauge}
              startAngle={180}
              endAngle={0}
              barSize={18}
            >
              <RadialBar background dataKey="value" cornerRadius={9} />
              <Tooltip />
            </RadialBarChart>
          </ResponsiveContainer>
        </div>
        <div className="-mt-12 text-center">
          <p className="text-3xl font-bold text-cyan-300">{Math.round(tokenUsagePercent)}%</p>
          <p className="text-xs text-slate-400">Estimated cost: INR {Math.round(tokenCostInr).toLocaleString("en-IN")}</p>
        </div>
      </section>
    </div>
  );
}
