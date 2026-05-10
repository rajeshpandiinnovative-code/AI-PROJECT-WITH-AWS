import Link from "next/link";
import { Sparkles } from "lucide-react";

import { modulePillars } from "@/src/lib/modules";

export default function ModulesPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-12 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">AI Academy Pro</p>
            <h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">All Learning Modules</h1>
          </div>
          <Link
            href="/"
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-cyan-300 hover:border-cyan-400"
          >
            Back to Landing
          </Link>
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
          ))}
        </div>
      </div>
    </main>
  );
}
