import Link from "next/link";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Sparkles } from "lucide-react";

import { DashboardInsightCharts } from "@/src/components/dashboard/DashboardInsightCharts";
import { VisualizationsAnalytics } from "@/src/components/visualizations/VisualizationsAnalytics";
import { buildDemoChartsPayload, parseDemoCookie } from "@/src/lib/dashboard-chart-data";

export const metadata: Metadata = {
  title: "Insight visualizations · AI Academy Pro",
  description: "Public preview of dashboard charts—coverage, marks bands, modules, and activity trends.",
};

export const dynamic = "force-dynamic";

export default async function VisualizationsPage() {
  const cookieStore = await cookies();
  const demoRaw = cookieStore.get("aap_demo")?.value;
  const demo = parseDemoCookie(demoRaw);
  const charts = buildDemoChartsPayload(demo, demo?.role, undefined);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <VisualizationsAnalytics />
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-300">
            <Sparkles className="size-4" />
            AI Academy Pro
          </Link>
          <nav className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
            <Link
              href="/"
              className="rounded-full border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-cyan-400 hover:text-cyan-300"
            >
              Landing
            </Link>
            <Link
              href="/login"
              className="rounded-full border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-cyan-400 hover:text-cyan-300"
            >
              Sign in
            </Link>
            <Link
              href="/dashboard"
              className="rounded-full bg-cyan-500 px-3 py-1.5 text-xs font-semibold text-slate-950 transition hover:bg-cyan-400"
            >
              Live dashboard
            </Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-300">Public preview</p>
          <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">Insight visualizations</h1>
          <p className="mt-4 text-slate-300">
            Interactive charts powered by the same insight UI as your dashboard. Data here is{" "}
            <strong className="font-semibold text-white">illustrative</strong> unless you are signed in with live
            tenant metrics. If you used demo selectors on the login page, their context shapes the sample curves via
            cookie.
          </p>
          <p className="mt-3 text-sm text-slate-500">
            For live numbers after onboarding, open{" "}
            <Link href="/dashboard" className="text-cyan-400 underline underline-offset-2 hover:text-cyan-300">
              Dashboard
            </Link>
            .
          </p>
        </div>

        <DashboardInsightCharts payload={charts} />
      </div>
    </main>
  );
}
