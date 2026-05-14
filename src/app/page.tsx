"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { CoachingHeroBanner } from "@/src/components/landing/CoachingHeroBanner";
import { PublicSiteHeader } from "@/src/components/landing/PublicSiteHeader";
import { WorkflowSlider } from "@/src/components/landing/WorkflowSlider";
import { getVisiblePillars } from "@/src/lib/modules";

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col overflow-x-hidden bg-slate-950 text-slate-100">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_85%_55%_at_50%_-15%,rgba(16,185,129,0.14),transparent_52%),radial-gradient(ellipse_50%_45%_at_100%_10%,rgba(34,211,238,0.09),transparent_50%),radial-gradient(ellipse_45%_40%_at_0%_30%,rgba(99,102,241,0.06),transparent_45%)]"
        aria-hidden
      />
      <div className="relative z-10 flex min-h-screen flex-col">
        <div>
          <PublicSiteHeader showBrandInHeader={false} />

          <section className="flex flex-col px-4 pb-6 pt-2 sm:pb-10 sm:pt-4 lg:pt-6">
            <div className="relative mx-auto grid w-full max-w-6xl grid-cols-1 gap-6 lg:grid-cols-2 lg:items-stretch lg:gap-8 lg:py-4">
              <div className="relative flex min-h-[280px] flex-col lg:min-h-[400px]">
                <div
                  className="pointer-events-none absolute inset-0 -z-10 blur-3xl sm:scale-105"
                  aria-hidden
                >
                  <div className="mx-auto h-48 max-w-md rounded-full bg-emerald-500/15" />
                </div>
                <CoachingHeroBanner
                  fitArtwork
                  artworkAlign="left"
                  brandOverlay={false}
                  className="h-full min-h-[280px] flex-1 shadow-black/50"
                />
              </div>

              <div className="flex min-h-[280px] flex-col lg:min-h-[400px]">
                <WorkflowSlider className="flex-1" />
              </div>
            </div>
          </section>
        </div>

        <section className="border-t border-slate-800/70 bg-slate-950/40 px-4 py-14 backdrop-blur-sm sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
              <div className="text-center sm:text-left">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-300/95">Explore</p>
                <h2 className="mt-3 text-2xl font-bold text-white sm:text-3xl">Learning modules</h2>
                <p className="mt-3 max-w-2xl text-pretty text-sm leading-relaxed text-slate-400 sm:text-base">
                  Marketing highlights below—everyone can browse these cards. Prefer the full catalog hub? Use modules.
                </p>
              </div>
              <Link
                href="/modules"
                className="inline-flex shrink-0 items-center justify-center gap-2 self-center rounded-xl border border-slate-600 bg-slate-900/80 px-5 py-3 text-sm font-semibold text-cyan-200 transition hover:border-cyan-400/50 hover:bg-slate-800/90 hover:text-white sm:self-auto"
              >
                Modules hub
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>

            <div className="mt-12 space-y-10">
              {getVisiblePillars().map((pillar) => (
                <section
                  key={pillar.id}
                  className={`rounded-2xl border border-slate-800/90 bg-gradient-to-br ${pillar.accentClass} p-6 shadow-lg shadow-black/20 ring-1 sm:p-7 ${pillar.ringClass}`}
                >
                  <h3 className="text-xl font-semibold text-white sm:text-2xl">{pillar.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-300 sm:text-base">{pillar.subtitle}</p>

                  <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {pillar.modules.map((mod) => (
                      <Link
                        key={mod.slug}
                        href={`/modules/${mod.slug}`}
                        className="group rounded-xl border border-slate-700/70 bg-slate-900/80 p-4 transition hover:border-cyan-400/55 hover:bg-slate-900"
                      >
                        <div className="inline-flex items-center gap-2 text-cyan-300">
                          <Sparkles className="size-4 transition group-hover:text-cyan-200" aria-hidden />
                          <span className="text-xs font-semibold uppercase tracking-[0.18em]">Marketing</span>
                        </div>
                        <p className="mt-3 text-base font-semibold text-white group-hover:text-cyan-50">{mod.title}</p>
                        <p className="mt-1 text-sm text-slate-300">{mod.description}</p>
                        <p className="mt-2 text-xs leading-snug text-emerald-300/95">{mod.outcome}</p>
                      </Link>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
