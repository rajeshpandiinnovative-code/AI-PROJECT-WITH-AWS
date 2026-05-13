import Link from "next/link";
import { notFound } from "next/navigation";

import { TopModuleWorkbench } from "@/src/components/modules/TopModuleWorkbench";
import { assertModulePageAccessOrRedirect, logDemoModuleView } from "@/src/lib/demo-access";
import { isMockApiMode } from "@/src/lib/api-mode";
import { allModules, getModuleBySlug, modulePillars } from "@/src/lib/modules";

export const dynamic = "force-dynamic";

type ModulePageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return allModules.map((entry) => ({ slug: entry.slug }));
}

export default async function ModuleDetailPage({ params }: ModulePageProps) {
  const { slug } = await params;
  const learningModule = getModuleBySlug(slug);
  if (!learningModule) notFound();

  const mockMode = isMockApiMode();

  if (!mockMode) {
    const access = await assertModulePageAccessOrRedirect(slug);
    if (access.mode === "demo") {
      await logDemoModuleView(access.demo.id, learningModule.slug, learningModule.title);
    }
  }

  const pillar = modulePillars.find((item) => item.modules.some((entry) => entry.slug === slug));

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-12 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl rounded-2xl border border-slate-800 bg-slate-900 p-6 sm:p-8">
        <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">AI Academy Pro Module</p>
        <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">{learningModule.title}</h1>
        <p className="mt-4 text-base text-slate-300">{learningModule.description}</p>

        <div className="mt-6 rounded-xl border border-slate-700 bg-slate-950 p-4">
          <p className="text-sm font-semibold text-cyan-300">Expected Outcome</p>
          <p className="mt-2 text-sm text-slate-300">{learningModule.outcome}</p>
        </div>

        <div className="mt-6 grid gap-3 rounded-xl border border-slate-700 bg-slate-950 p-4 sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-[0.15em] text-slate-400">Pillar</p>
            <p className="mt-1 text-sm text-white">{pillar?.title ?? "Core Pillars"}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.15em] text-slate-400">Module Slug</p>
            <p className="mt-1 text-sm font-mono text-cyan-300">{learningModule.slug}</p>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/modules"
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-cyan-300 hover:border-cyan-400"
          >
            Back to All Modules
          </Link>
          <Link
            href="/"
            className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-400"
          >
            Go to Landing
          </Link>
        </div>

        <TopModuleWorkbench moduleSlug={learningModule.slug} moduleTitle={learningModule.title} />
      </div>
    </main>
  );
}
