"use client";

import { Building2, Shield, UserCog, Users, GraduationCap } from "lucide-react";

export type HierarchyStaffRow = {
  id: string;
  displayName: string;
  email: string;
  role: string;
};

function tierLabel(role: string): { label: string; Icon: typeof Building2; accent: string } {
  if (role === "school_org") return { label: "Owner / Institution", Icon: Building2, accent: "text-amber-300" };
  if (role === "management") return { label: "Principal (Executive)", Icon: Shield, accent: "text-indigo-300" };
  if (role === "admin") return { label: "School Admin", Icon: UserCog, accent: "text-cyan-300" };
  if (role === "teacher") return { label: "Teacher", Icon: GraduationCap, accent: "text-emerald-300" };
  return { label: "Learner / Other", Icon: Users, accent: "text-slate-400" };
}

const ORDER = ["school_org", "management", "admin", "teacher", "parent", "student", "master_admin"];

function sortKey(role: string): number {
  const i = ORDER.indexOf(role);
  return i === -1 ? 99 : i;
}

/**
 * Read-only visual map of staff layers (top-down delegation story).
 * Data must already be filtered to a single `tenantId` on the server.
 */
export function HierarchyTree({ staff }: { staff: HierarchyStaffRow[] }) {
  const sorted = [...staff].sort((a, b) => {
    const d = sortKey(a.role) - sortKey(b.role);
    return d !== 0 ? d : a.displayName.localeCompare(b.displayName);
  });

  const layers = ORDER.map((role) => ({
    role,
    people: sorted.filter((p) => p.role === role),
  })).filter((layer) => layer.people.length > 0);

  return (
    <div className="rounded-2xl border border-slate-800/90 bg-slate-950/80 p-5 shadow-inner shadow-black/40">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-indigo-300/90">Structure</p>
          <h3 className="mt-1 text-lg font-semibold text-white">Institutional hierarchy</h3>
          <p className="mt-1 text-xs text-slate-500">
            Owner → Principal → School Admin → Teacher. Teachers: grading & class modules only.
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-5">
        {layers.map(({ role, people }) => {
          const { label, Icon, accent } = tierLabel(role);
          return (
            <div key={role}>
              <div className="flex items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-slate-700 bg-slate-900">
                  <Icon className={`size-4 ${accent}`} aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-xs font-semibold uppercase tracking-wide ${accent}`}>{label}</p>
                  <p className="text-[11px] text-slate-500">{people.length} seat{people.length === 1 ? "" : "s"}</p>
                  <ul className="mt-2 space-y-1.5">
                    {people.map((p) => (
                      <li
                        key={p.id}
                        className="truncate rounded-md border border-slate-800/80 bg-slate-900/60 px-3 py-2 text-sm text-slate-200"
                      >
                        <span className="font-medium text-white">{p.displayName || "(unnamed)"}</span>
                        <span className="ml-2 font-mono text-xs text-slate-500">{p.email}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
