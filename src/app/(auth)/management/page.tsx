import Link from "next/link";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { Crown, Lock, Users, Sparkles } from "lucide-react";

import { requireManagementSession } from "@/src/components/management/institution-access";
import { getStaffLicenseCap, STAFF_LICENSE_ROLES } from "@/src/components/management/staff-licenses";
import { db } from "@/src/lib/db";
import { platformUsers } from "@/src/db/schema";

export const dynamic = "force-dynamic";

export default async function ManagementDashboardPage() {
  const { tenantId, paid, role } = await requireManagementSession();

  if (role === "MANAGEMENT") {
    redirect("/management/dashboard");
  }

  const staffRows = await db
    .select({
      id: platformUsers.id,
      role: platformUsers.role,
    })
    .from(platformUsers)
    .where(eq(platformUsers.schoolId, tenantId));

  const usedLicenses = staffRows.filter((r) => STAFF_LICENSE_ROLES.has(r.role)).length;
  const cap = getStaffLicenseCap();
  const principals = staffRows.filter((r) => r.role === "MANAGEMENT").length;
  const admins = staffRows.filter((r) => r.role === "SCHOOL_ADMIN").length;
  const teachers = staffRows.filter((r) => r.role === "TEACHER").length;

  const isOwner = role === "MANAGEMENT";

  return (
    <div className="space-y-8">
      {!paid ? (
        <div className="rounded-xl border border-amber-500/35 bg-amber-950/25 px-4 py-3 text-sm text-amber-100">
          <div className="flex flex-wrap items-center gap-2">
            <Lock className="size-4 text-amber-300" aria-hidden />
            <span className="font-semibold text-white">View-only mode</span>
          </div>
          <p className="mt-2 text-amber-100/90">
            This institution is not on an active paid plan (or billing enforcement is on and the subscription is inactive).
            You can review analytics links, but{" "}
            <strong className="text-white">User Management &amp; Delegation</strong> stays locked until billing is active.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 px-4 py-3 text-sm text-emerald-100">
          <div className="flex flex-wrap items-center gap-2">
            <Sparkles className="size-4 text-emerald-300" aria-hidden />
            <span className="font-semibold text-white">Paid institution</span>
          </div>
          <p className="mt-2 text-emerald-100/90">
            Delegation tools are available. {isOwner ? "As Owner, you can invite Principals from Staff Directory." : ""}
          </p>
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Active staff licenses"
          value={`${usedLicenses} of ${cap}`}
          hint="Teachers, school admins, principals, and owner seats."
          icon={<Users className="size-5 text-indigo-300" aria-hidden />}
        />
        <MetricCard
          title="Principals (exec)"
          value={String(principals)}
          hint="management role — delegates admins & teachers."
          icon={<Crown className="size-5 text-amber-300" aria-hidden />}
        />
        <MetricCard title="School admins" value={String(admins)} hint="Student data & schedules." />
        <MetricCard title="Teachers" value={String(teachers)} hint="AI grading & class modules." />
      </section>

      <section className="rounded-2xl border border-slate-800/90 bg-slate-900/50 p-6">
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-300/90">Top-down permissions</h2>
        <ul className="mt-4 space-y-3 text-sm text-slate-300">
          <li>
            <span className="font-semibold text-amber-200">Management:</span> full institutional view; Admin Console to
            create/manage Principal accounts when paid.
          </li>
          <li>
            <span className="font-semibold text-indigo-200">Principal:</span> manages School Admins and Teachers.
          </li>
          <li>
            <span className="font-semibold text-cyan-200">School Admin:</span> student data and schedules.
          </li>
          <li>
            <span className="font-semibold text-emerald-200">Teacher:</span> AI grading and class modules only.
          </li>
        </ul>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/management/staff-management"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-900/40 hover:bg-indigo-500"
          >
            Open staff directory
          </Link>
          <Link
            href="/school/dashboard"
            className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium text-slate-200 hover:border-indigo-500/50 hover:text-white"
          >
            Academic console
          </Link>
        </div>
      </section>
    </div>
  );
}

function MetricCard({
  title,
  value,
  hint,
  icon,
}: {
  title: string;
  value: string;
  hint: string;
  icon?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-800/80 bg-slate-950/80 p-4 shadow-inner shadow-black/20">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{title}</p>
        {icon}
      </div>
      <p className="mt-2 text-2xl font-bold tabular-nums text-white">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{hint}</p>
    </div>
  );
}
