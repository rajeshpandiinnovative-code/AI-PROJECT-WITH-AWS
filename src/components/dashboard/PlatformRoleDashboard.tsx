import Link from "next/link";
import type { Session } from "next-auth";
import { LayoutDashboard, ExternalLink } from "lucide-react";

import { PilotNav } from "@/src/components/PilotNav";
import type { DashboardChartsPayload, DemoContextCookie } from "@/src/lib/dashboard-chart-data";
import { PLATFORM_ROLE_LABELS, type PlatformRole } from "@/src/lib/platform-roles";

import { DashboardInsightCharts } from "./DashboardInsightCharts";

export function PlatformRoleDashboard({
  session,
  demo,
  charts,
  showMasterInsights = false,
}: {
  session: Session;
  demo: DemoContextCookie | null;
  charts: DashboardChartsPayload;
  /** Set when signed-in user is in `MASTER_ADMIN_EMAILS` — link to nationwide insights. */
  showMasterInsights?: boolean;
}) {
  const role = session.user?.role ?? "student";
  const roleLabel = PLATFORM_ROLE_LABELS[role as PlatformRole] ?? role;
  const email = session.user?.email ?? "";

  return (
    <div className="min-h-screen bg-[#0F172A] text-zinc-100">
      <header className="border-b border-slate-700/80 bg-[#1E293B]/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <Link href="/" className="text-sm font-medium text-slate-300 transition hover:text-white">
            ← Home
          </Link>
          <PilotNav />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10 sm:py-14">
        <div className="mb-2 inline-flex items-center gap-2 text-emerald-400">
          <LayoutDashboard className="size-5" aria-hidden />
          <span className="text-xs font-semibold uppercase tracking-wider">Role dashboard</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          {role === "master_admin" ? (
            "Super Admin"
          ) : showMasterInsights ? (
            <>
              Super Admin
              <span className="mt-3 block text-lg font-semibold leading-snug text-slate-400 sm:text-xl">
                Account role: {roleLabel}
              </span>
            </>
          ) : (
            roleLabel
          )}
        </h1>
        {email ? <p className="mt-2 font-mono text-sm text-slate-400">{email}</p> : null}

        <div className="mt-4 rounded-xl border border-slate-700 bg-[#1E293B] px-4 py-3 text-sm text-slate-300">
          <p className="text-xs font-semibold uppercase tracking-wide text-cyan-300">Demo context</p>
          <p className="mt-2 text-slate-400">
            {demo ? (
              <>
                {demo.displayName ? (
                  <>
                    <span className="text-slate-200">Name:</span> {demo.displayName}
                    {demo.mobile ? (
                      <>
                        {" "}
                        · <span className="text-slate-200">Mobile:</span> {demo.mobile}
                      </>
                    ) : null}
                    <span className="text-slate-600"> · </span>
                  </>
                ) : null}
                <span className="text-slate-200">Board:</span> {demo.board} · <span className="text-slate-200">Role:</span>{" "}
                {demo.role} · <span className="text-slate-200">Location:</span> {demo.city}, {demo.district},{" "}
                {demo.state}
              </>
            ) : (
              <>
                Use{" "}
                <Link href="/login?mode=demo" className="text-cyan-400 underline">
                  Demo login
                </Link>{" "}
                from the home page to set context. Charts below use illustrative data until you link a school.
              </>
            )}
          </p>
        </div>

        <DashboardInsightCharts payload={charts} />

        {showMasterInsights ? (
          <div className="mt-8 rounded-xl border border-amber-500/40 bg-amber-950/25 px-4 py-3 text-sm text-amber-100">
            <span className="font-semibold text-amber-200">Super Admin</span> — open the nationwide insights dashboard:{" "}
            <Link href="/insights" className="font-semibold text-amber-300 underline">
              /insights
            </Link>
          </div>
        ) : null}

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <Link
            href="/onboarding"
            className="group flex flex-col rounded-2xl border border-slate-600 bg-[#1E293B] p-6 transition hover:border-cyan-500/50"
          >
            <span className="mt-4 text-lg font-semibold text-white">Claim or link a school</span>
            <span className="mt-1 text-sm text-slate-400">Connect tenant data for live operations charts.</span>
            <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-cyan-400">
              Open <ExternalLink className="size-3.5" aria-hidden />
            </span>
          </Link>
          <Link
            href="/pricing"
            className="group flex flex-col rounded-2xl border border-slate-600 bg-[#1E293B] p-6 transition hover:border-emerald-500/50"
          >
            <span className="mt-4 text-lg font-semibold text-white">Plans by board &amp; role</span>
            <span className="mt-1 text-sm text-slate-400">Upgrade from trial when you are ready.</span>
            <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-emerald-400">
              Pricing <ExternalLink className="size-3.5" aria-hidden />
            </span>
          </Link>
        </div>
      </main>
    </div>
  );
}
