"use client";

import { useCallback, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { INDIAN_STATES, getDistrictsForState } from "@/src/lib/india-demo-locations";
import type { GeoRow, GeoScope, RevenueGranularity } from "@/src/lib/insights-data";

type Totals = {
  demoSessions: number;
  payingPlatformUsers: number;
  payingSchools: number;
};

type GeoPayload = {
  rows: GeoRow[];
  totals: Totals;
  hint?: string;
};

function formatInrMinor(amountMinor: number): string {
  const rupees = amountMinor / 100;
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(
    rupees,
  );
}

export function MasterInsightsDashboard({
  initialGeo,
  initialRevenue,
}: {
  initialGeo: GeoPayload;
  initialRevenue: { label: string; amountMinor: number }[];
}) {
  const [scope, setScope] = useState<GeoScope>("national");
  const [state, setState] = useState("");
  const [district, setDistrict] = useState("");
  const [revGrain, setRevGrain] = useState<RevenueGranularity>("month");
  const [geo, setGeo] = useState<GeoPayload>(initialGeo);
  const [revenueSeries, setRevenueSeries] = useState(initialRevenue);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const districts = state ? getDistrictsForState(state) : [];

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const q = new URLSearchParams({ scope, revenue: revGrain });
      if (scope !== "national" && state) q.set("state", state);
      if (scope === "district" && district) q.set("district", district);
      const res = await fetch(`/api/admin/insights?${q.toString()}`);
      if (!res.ok) {
        setError("Could not refresh insights.");
        return;
      }
      const data = (await res.json()) as { geo: GeoPayload; revenueSeries: typeof initialRevenue };
      setGeo(data.geo);
      setRevenueSeries(data.revenueSeries);
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }, [scope, state, district, revGrain]);

  const chartRows = geo.rows.map((r) => ({
    name: r.label.length > 24 ? `${r.label.slice(0, 22)}…` : r.label,
    Demo: r.demo,
    Paid: r.paid,
  }));

  const revenueChart = revenueSeries.map((r) => ({
    period: r.label,
    revenue: Math.round(r.amountMinor / 100),
  }));

  return (
    <div className="space-y-10">
      <section className="rounded-2xl border border-slate-700 bg-slate-900/80 p-6">
        <h2 className="text-lg font-semibold text-white">Filters</h2>
        <p className="mt-1 text-sm text-slate-400">
          Demo sessions vs paying accounts (platform users + schools with active access). Revenue uses Stripe{" "}
          <code className="rounded bg-slate-800 px-1 text-cyan-300">invoice.paid</code> rows after you run{" "}
          <code className="rounded bg-slate-800 px-1">sql/0005_revenue_events.sql</code>.
        </p>
        <div className="mt-4 flex flex-wrap items-end gap-4">
          <label className="flex flex-col gap-1 text-xs text-slate-400">
            Geography roll-up
            <select
              value={scope}
              onChange={(e) => {
                setScope(e.target.value as GeoScope);
                if (e.target.value === "national") {
                  setState("");
                  setDistrict("");
                }
              }}
              className="rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-white"
            >
              <option value="national">Nationwide (by state/UT)</option>
              <option value="state">One state — districts</option>
              <option value="district">One district — cities (demo)</option>
            </select>
          </label>
          {scope !== "national" ? (
            <label className="flex min-w-[200px] flex-col gap-1 text-xs text-slate-400">
              State / UT
              <select
                value={state}
                onChange={(e) => {
                  setState(e.target.value);
                  setDistrict("");
                }}
                className="rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-white"
              >
                <option value="">Select…</option>
                {INDIAN_STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          {scope === "district" && state ? (
            <label className="flex min-w-[200px] flex-col gap-1 text-xs text-slate-400">
              District
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-white"
              >
                <option value="">Select…</option>
                {districts.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <label className="flex flex-col gap-1 text-xs text-slate-400">
            Revenue bucket
            <select
              value={revGrain}
              onChange={(e) => setRevGrain(e.target.value as RevenueGranularity)}
              className="rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-white"
            >
              <option value="day">Daily</option>
              <option value="week">Weekly</option>
              <option value="month">Monthly</option>
              <option value="year">Yearly</option>
            </select>
          </label>
          <button
            type="button"
            onClick={() => void refresh()}
            disabled={loading}
            className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-500 disabled:opacity-50"
          >
            {loading ? "Loading…" : "Apply"}
          </button>
        </div>
        {error ? <p className="mt-3 text-sm text-rose-400">{error}</p> : null}
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/30 px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-cyan-300">Demo sessions (all time)</p>
          <p className="mt-1 text-2xl font-bold text-white">{geo.totals.demoSessions}</p>
        </div>
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/30 px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-emerald-300">Paying platform users</p>
          <p className="mt-1 text-2xl font-bold text-white">{geo.totals.payingPlatformUsers}</p>
        </div>
        <div className="rounded-xl border border-violet-500/30 bg-violet-950/30 px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-violet-300">Paying schools (tenant)</p>
          <p className="mt-1 text-2xl font-bold text-white">{geo.totals.payingSchools}</p>
        </div>
      </section>

      {geo.hint ? <p className="text-sm text-amber-200/90">{geo.hint}</p> : null}

      <section className="rounded-2xl border border-slate-700 bg-slate-900/60 p-6">
        <h2 className="text-lg font-semibold text-white">Demo vs paid (selected geography)</h2>
        <div className="mt-6 h-[380px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartRows} margin={{ top: 8, right: 8, left: 8, bottom: 48 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} angle={-35} textAnchor="end" height={70} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <Tooltip
                contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155" }}
                labelStyle={{ color: "#e2e8f0" }}
              />
              <Legend />
              <Bar dataKey="Demo" fill="#22d3ee" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Paid" fill="#34d399" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-700 bg-slate-900/60 p-6">
        <h2 className="text-lg font-semibold text-white">Revenue (INR, from recorded invoices)</h2>
        <p className="mt-1 text-sm text-slate-400">Stripe amounts in smallest currency unit — displayed as rupees.</p>
        <div className="mt-6 h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={revenueChart} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="period" tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <Tooltip
                formatter={(value) =>
                  typeof value === "number"
                    ? new Intl.NumberFormat("en-IN", {
                        style: "currency",
                        currency: "INR",
                        maximumFractionDigits: 0,
                      }).format(value)
                    : ""
                }
                contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155" }}
              />
              <Line type="monotone" dataKey="revenue" name="Revenue (₹)" stroke="#fbbf24" strokeWidth={2} dot />
            </LineChart>
          </ResponsiveContainer>
        </div>
        {revenueSeries.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">No revenue rows yet — complete a paid Stripe invoice after migration.</p>
        ) : (
          <p className="mt-4 text-sm text-slate-500">
            Latest period total: {formatInrMinor(revenueSeries[revenueSeries.length - 1]?.amountMinor ?? 0)}
          </p>
        )}
      </section>
    </div>
  );
}
