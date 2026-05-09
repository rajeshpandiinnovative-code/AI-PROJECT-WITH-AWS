"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { DashboardChartsPayload } from "@/src/lib/dashboard-chart-data";

const tickStyle = { fill: "#94a3b8", fontSize: 11 };

const PALETTE = {
  cyan: "#22d3ee",
  teal: "#2dd4bf",
  emerald: "#34d399",
  violet: "#a78bfa",
  amber: "#fbbf24",
  rose: "#fb7185",
  pink: "#f472b6",
  sky: "#38bdf8",
};

const OVERVIEW_COLORS = [PALETTE.cyan, PALETTE.teal, PALETTE.emerald, PALETTE.violet];
const MARKS_PIE_COLORS = [PALETTE.rose, PALETTE.amber, PALETTE.emerald, PALETTE.cyan];
const MODULE_BAR = PALETTE.violet;
const INTERVENTION_BAR = PALETTE.amber;
const ROLE_BAR = PALETTE.pink;

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-700 bg-[#1E293B] p-4 shadow-inner">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-cyan-300">{title}</h3>
      {subtitle ? <p className="mt-1 text-xs text-slate-500">{subtitle}</p> : null}
      <div className="mt-3 h-64 w-full min-h-[240px]">{children}</div>
    </div>
  );
}

const tooltipProps = {
  contentStyle: { background: "#0f172a", border: "1px solid #334155", borderRadius: 8 },
  labelStyle: { color: "#e2e8f0" },
};

export function DashboardInsightCharts({ payload }: { payload: DashboardChartsPayload }) {
  const modeLabel = payload.mode === "demo" ? "Illustrative preview" : "Live tenant data";

  return (
    <section className="mt-8 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-white">Insights &amp; trends</h2>
          <p className="mt-1 text-xs text-slate-400">
            {modeLabel} · bars, pies, and lines — metrics refresh as learners use modules.
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Coverage overview" subtitle="Core volumes">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={payload.overview} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" tick={tickStyle} stroke="#64748b" />
              <YAxis tick={tickStyle} stroke="#64748b" allowDecimals={false} />
              <Tooltip {...tooltipProps} />
              <Bar dataKey="value" name="Count" radius={[4, 4, 0, 0]}>
                {payload.overview.map((_, i) => (
                  <Cell key={cellKey("ov", i)} fill={OVERVIEW_COLORS[i % OVERVIEW_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Marks distribution" subtitle="Share of recent submissions">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={payload.marksBands}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={52}
                outerRadius={88}
                paddingAngle={2}
              >
                {payload.marksBands.map((_, i) => (
                  <Cell key={cellKey("mk", i)} fill={MARKS_PIE_COLORS[i % MARKS_PIE_COLORS.length]} stroke="#1e293b" />
                ))}
              </Pie>
              <Tooltip {...tooltipProps} />
              <Legend wrapperStyle={{ fontSize: 11, color: "#94a3b8" }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Module activity (7 days)" subtitle="Learning events per day">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={payload.activityTrend} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" tick={tickStyle} stroke="#64748b" />
              <YAxis tick={tickStyle} stroke="#64748b" allowDecimals={false} />
              <Tooltip {...tooltipProps} />
              <Line
                type="monotone"
                dataKey="value"
                name="Events"
                stroke={PALETTE.sky}
                strokeWidth={2.5}
                dot={{ fill: PALETTE.sky, strokeWidth: 0, r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Module attempts" subtitle="By module (volume)">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={payload.moduleAttempts}
              margin={{ top: 8, right: 16, left: 8, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
              <XAxis type="number" tick={tickStyle} stroke="#64748b" allowDecimals={false} />
              <YAxis type="category" dataKey="name" width={108} tick={tickStyle} stroke="#64748b" />
              <Tooltip {...tooltipProps} />
              <Bar dataKey="value" name="Attempts" fill={MODULE_BAR} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Interventions" subtitle="Pipeline snapshot">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={payload.interventionPipeline} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" tick={tickStyle} stroke="#64748b" />
              <YAxis tick={tickStyle} stroke="#64748b" allowDecimals={false} />
              <Tooltip {...tooltipProps} />
              <Legend wrapperStyle={{ fontSize: 12, color: "#94a3b8" }} />
              <Bar dataKey="value" name="Tasks" fill={INTERVENTION_BAR} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {payload.roleInsight && payload.roleInsight.length > 0 ? (
        <ChartCard title="Role signals" subtitle="Scores & risk proxies">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={payload.roleInsight} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis
                dataKey="name"
                tick={tickStyle}
                stroke="#64748b"
                interval={0}
                angle={-12}
                textAnchor="end"
                height={56}
              />
              <YAxis tick={tickStyle} stroke="#64748b" allowDecimals={false} />
              <Tooltip {...tooltipProps} />
              <Bar dataKey="value" name="Value" fill={ROLE_BAR} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      ) : null}
    </section>
  );
}

function cellKey(prefix: string, i: number): string {
  return `${prefix}-${i}`;
}
