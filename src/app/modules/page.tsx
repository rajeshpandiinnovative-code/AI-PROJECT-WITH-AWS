import Link from "next/link";
import { Sparkles } from "lucide-react";

import { PublicSiteHeader } from "@/src/components/landing/PublicSiteHeader";
import { requireModulesViewerOrRedirect } from "@/src/lib/demo-access";
import { getDefaultFilteredPillars, visibilityRoleFromSession } from "@/src/lib/module-visibility";
import { insertDemoSessionEvent } from "@/src/lib/demo-session";
import { resolveSchoolUnlockedFromSession } from "@/src/lib/subscription";
import { isMockApiMode } from "@/src/lib/api-mode";
import { modulePillars } from "@/src/lib/modules";

export const dynamic = "force-dynamic";

export default async function ModulesPage() {
  const mockMode = isMockApiMode();

  if (mockMode) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100">
        <PublicSiteHeader />
        <div className="px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mb-10">
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">Ghost Mode</p>
              <h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">All Learning Modules</h1>
              <p className="mt-2 text-sm text-slate-400">21 modules across 4 pillars — fully operational in mock mode.</p>
            </div>
            <div className="mt-10 space-y-8">
              {modulePillars.map((pillar) => (
                <section
                  key={pillar.id}
                  className={`rounded-2xl border border-slate-800 bg-gradient-to-br ${pillar.accentClass} p-6 ring-1 ${pillar.ringClass}`}
                >
                  <h2 className="text-2xl font-semibold text-white">{pillar.title}</h2>
                  <p className="mt-2 text-slate-300">{pillar.subtitle}</p>
                  <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {pillar.modules.map((mod) => (
                      <Link
                        key={mod.slug}
                        href={`/modules/${mod.slug}`}
                        className="rounded-xl border border-slate-700/70 bg-slate-900/75 p-4 transition hover:border-cyan-400/60"
                      >
                        <div className="inline-flex items-center gap-2 text-cyan-300">
                          <Sparkles className="size-4" />
                          <span className="text-xs font-semibold uppercase tracking-[0.18em]">Module</span>
                        </div>
                        <h3 className="mt-3 text-base font-semibold text-white">{mod.title}</h3>
                        <p className="mt-1 text-sm text-slate-300">{mod.description}</p>
                        <p className="mt-2 text-xs text-emerald-300">{mod.outcome}</p>
                      </Link>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  const access = await requireModulesViewerOrRedirect();
  if (access.mode === "demo") {
    await insertDemoSessionEvent(access.demo.id, "modules_hub_view", {
      role: access.demo.role,
    });
  }

  const demoBanner =
    access.mode === "demo"
      ? {
          profile: access.demo.profile,
          expiresAt: access.demo.expiresAt,
        }
      : null;

  const visiblePillars =
    access.mode === "auth"
      ? getDefaultFilteredPillars(
          visibilityRoleFromSession(access.session),
          await resolveSchoolUnlockedFromSession(access.session),
          access.session,
        )
      : getDefaultFilteredPillars(access.demo.role, true);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <PublicSiteHeader />
      <div className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {demoBanner?.profile.displayName ? (
            <div className="mb-8 rounded-xl border border-cyan-500/35 bg-cyan-950/40 px-4 py-3 text-sm text-cyan-100">
              <span className="font-semibold text-white">Demo</span>
              <span className="mx-2 text-cyan-500/80">·</span>
              <span>{demoBanner.profile.displayName}</span>
              {demoBanner.profile.mobile ? (
                <span className="text-cyan-200/90"> · {demoBanner.profile.mobile}</span>
              ) : null}
              <span className="text-slate-400">
                {" "}
                · {demoBanner.profile.city}, {demoBanner.profile.district}, {demoBanner.profile.state}
              </span>
              <span className="mt-2 block text-xs text-cyan-200/90">
                Role: <span className="font-medium text-white">{demoBanner.profile.role}</span>
                {" · "}
                Full module access until{" "}
                <time dateTime={demoBanner.expiresAt.toISOString()}>
                  {demoBanner.expiresAt.toLocaleString(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </time>
              </span>
            </div>
          ) : null}
          <div className="mb-10">
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">Modules</p>
            <h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">All Learning Modules</h1>
          </div>

          <div className="mt-10 space-y-8">
            {visiblePillars.length === 0 ? (
              <div className="rounded-xl border border-amber-500/35 bg-amber-950/35 px-4 py-6 text-sm text-amber-100">
                <p className="font-semibold text-white">No modules visible yet</p>
                <p className="mt-2 text-amber-100/90">
                  Your role does not have any modules assigned, or the institution has not unlocked access. Ask your
                  founder / institution contact or master admin once billing is active.
                </p>
              </div>
            ) : (
              visiblePillars.map((pillar) => (
                <section
                  key={pillar.id}
                  className={`rounded-2xl border border-slate-800 bg-gradient-to-br ${pillar.accentClass} p-6 ring-1 ${pillar.ringClass}`}
                >
                  <h2 className="text-2xl font-semibold text-white">{pillar.title}</h2>
                  <p className="mt-2 text-slate-300">{pillar.subtitle}</p>

                  <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {pillar.modules.map((module) => (
                      <Link
                        key={module.slug}
                        href={`/modules/${module.slug}`}
                        className="rounded-xl border border-slate-700/70 bg-slate-900/75 p-4 transition hover:border-cyan-400/60"
                      >
                        <div className="inline-flex items-center gap-2 text-cyan-300">
                          <Sparkles className="size-4" />
                          <span className="text-xs font-semibold uppercase tracking-[0.18em]">Module</span>
                        </div>
                        <h3 className="mt-3 text-base font-semibold text-white">{module.title}</h3>
                        <p className="mt-1 text-sm text-slate-300">{module.description}</p>
                        <p className="mt-2 text-xs text-emerald-300">{module.outcome}</p>
                      </Link>
                    ))}
                  </div>
                </section>
              )))
            }
          </div>
        </div>
      </div>
    </main>
  );
}
