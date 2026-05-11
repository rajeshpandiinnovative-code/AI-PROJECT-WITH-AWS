"use client";

import { useState, useTransition } from "react";
import { setModuleGradePolicyAction } from "@/src/app/(auth)/school-admin/actions";

export type ModuleToggleItem = { slug: string; title: string };

export function ModuleToggle({
  gradeLabels,
  modules,
  initialEnabled,
}: {
  gradeLabels: readonly string[];
  modules: readonly ModuleToggleItem[];
  /** grade -> slug -> enabled (defaults true when missing). */
  initialEnabled: Record<string, Record<string, boolean>>;
}) {
  const [pending, start] = useTransition();
  const [state, setState] = useState(() => structuredClone(initialEnabled));

  function isOn(grade: string, slug: string): boolean {
    const g = state[grade];
    if (!g) return true;
    if (slug in g) return Boolean(g[slug]);
    return true;
  }

  function toggle(grade: string, slug: string, next: boolean) {
    setState((prev) => {
      const copy = { ...prev, [grade]: { ...prev[grade], [slug]: next } };
      return copy;
    });
    start(async () => {
      const fd = new FormData();
      fd.set("gradeLabel", grade);
      fd.set("moduleSlug", slug);
      fd.set("enabled", next ? "true" : "false");
      await setModuleGradePolicyAction(fd);
    });
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 text-slate-900 shadow-sm">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Module visibility by grade band</p>
        {pending ? <span className="text-[10px] text-slate-500">Saving…</span> : null}
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-[11px]">
          <thead>
            <tr className="border-b border-slate-200 text-left text-[10px] font-semibold uppercase text-slate-500">
              <th className="py-1 pr-2">Module</th>
              {gradeLabels.map((g) => (
                <th key={g} className="px-1 py-1 text-center">
                  <span className="inline-block max-w-[7rem] leading-tight">{g}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {modules.map((m) => (
              <tr key={m.slug}>
                <td className="py-1 pr-2 font-medium text-slate-800">{m.title}</td>
                {gradeLabels.map((g) => (
                  <td key={g + m.slug} className="px-1 py-1 text-center">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={isOn(g, m.slug)}
                      onClick={() => toggle(g, m.slug, !isOn(g, m.slug))}
                      className={`inline-flex h-6 w-11 items-center rounded-full border transition ${
                        isOn(g, m.slug)
                          ? "border-emerald-500 bg-emerald-500/90"
                          : "border-slate-300 bg-slate-200"
                      }`}
                    >
                      <span
                        className={`ml-0.5 inline-block size-4 rounded-full bg-white shadow transition ${
                          isOn(g, m.slug) ? "translate-x-5" : "translate-x-0.5"
                        }`}
                      />
                    </button>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-[10px] text-slate-500">
        Defaults to <strong>on</strong> until toggled. Policies are stored per tenant — Management billing views stay
        separate.
      </p>
    </div>
  );
}
