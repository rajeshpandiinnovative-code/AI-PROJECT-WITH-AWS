import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { MasterInsightsDashboard } from "@/src/components/insights/MasterInsightsDashboard";
import { fetchInsightsGeo, fetchRevenueSeries } from "@/src/lib/insights-data";
import { isFounderSuperAdmin } from "@/src/lib/rbac";
import { primaryDashboardPathForPlatformRole } from "@/src/lib/post-login-redirect";

export const metadata: Metadata = {
  title: "Insights · AI Academy Pro",
  description: "Nationwide demo vs paid analytics and revenue — master access only.",
};

export const dynamic = "force-dynamic";

export default async function InsightsPage() {
  const session = await auth();
  if (!isFounderSuperAdmin(session)) {
    const role = session?.user?.role;
    const dest = primaryDashboardPathForPlatformRole(typeof role === "string" ? role : undefined);
    redirect(`${dest}?access_error=admin_clearance_required`);
  }

  const [geo, revenueSeries] = await Promise.all([
    fetchInsightsGeo({ scope: "national" }),
    fetchRevenueSeries("month"),
  ]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-950/90">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <Link href="/" className="text-sm font-medium text-slate-400 transition hover:text-white">
            ← Home
          </Link>
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400">Super Admin insights</span>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-10">
        <p className="text-xs uppercase tracking-[0.28em] text-emerald-400">Overview</p>
        <h1 className="mt-2 text-3xl font-bold text-white">Nationwide dashboard</h1>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-400">
          Compare <span className="text-cyan-300">demo logins</span> (tracked sessions) with{" "}
          <span className="text-emerald-300">paying accounts</span> (platform users and schools with active access).
          Revenue charts fill after Stripe sends <code className="rounded bg-slate-800 px-1 text-xs">invoice.paid</code>{" "}
          and the <code className="rounded bg-slate-800 px-1 text-xs">revenue_events</code> table exists.
        </p>

        <div className="mt-10">
          <MasterInsightsDashboard initialGeo={geo} initialRevenue={revenueSeries} />
        </div>
      </main>
    </div>
  );
}
