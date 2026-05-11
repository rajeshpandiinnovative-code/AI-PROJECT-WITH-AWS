"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { BarChart3, Building2, CreditCard, LayoutDashboard, LogOut, ScanLine, Shield } from "lucide-react";

/** Mirrors `school-admin-access` / `institution-access` without importing server `auth()` into this client bundle. */
function isSchoolStaffAdminRole(role: string | undefined | null) {
  const r = (role ?? "").trim();
  return r === "admin" || r === "SCHOOL_ADMIN";
}

function isManagementConsoleRole(role: string | undefined | null) {
  const r = (role ?? "").trim();
  return r === "management" || r === "school_org";
}

/**
 * Signed-in console shortcuts for India-wide rollout (landing header avoids duplicating Claim School).
 */
export function PilotNav() {
  const { data: session, status } = useSession();
  const showSchoolAdmin = isSchoolStaffAdminRole(session?.user?.role);
  const showManagement = isManagementConsoleRole(session?.user?.role);

  if (status !== "authenticated") {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
      {showSchoolAdmin ? (
        <Link
          href="/school-admin"
          className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-emerald-700/50 bg-emerald-950/40 px-2.5 text-xs text-emerald-100 hover:border-emerald-500/50 hover:text-white sm:px-3 sm:text-sm"
        >
          <Shield className="size-4" aria-hidden />
          <span className="hidden sm:inline">School admin</span>
        </Link>
      ) : null}
      {showManagement ? (
        <Link
          href="/management"
          className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-indigo-700/50 bg-indigo-950/40 px-2.5 text-xs text-indigo-100 hover:border-indigo-500/50 hover:text-white sm:px-3 sm:text-sm"
        >
          <Building2 className="size-4" aria-hidden />
          <span className="hidden sm:inline">Management</span>
        </Link>
      ) : null}
      <Link
        href="/visualizations"
        className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-slate-600 bg-slate-800/50 px-2.5 text-xs text-slate-200 hover:border-cyan-500/35 hover:text-white sm:px-3 sm:text-sm"
      >
        <BarChart3 className="size-4" aria-hidden />
        <span className="hidden sm:inline">Charts</span>
      </Link>
      <Link
        href="/dashboard"
        className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-slate-600 bg-slate-800/50 px-2.5 text-xs text-slate-200 hover:border-slate-500 hover:text-white sm:px-3 sm:text-sm"
      >
        <LayoutDashboard className="size-4" aria-hidden />
        <span className="hidden sm:inline">Dashboard</span>
      </Link>
      <Link
        href="/scanner"
        className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-slate-600 bg-slate-800/50 px-2.5 text-xs text-slate-200 hover:border-slate-500 hover:text-white sm:px-3 sm:text-sm"
      >
        <ScanLine className="size-4" aria-hidden />
        Scan
      </Link>
      <Link
        href="/pricing"
        className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-slate-600 bg-slate-800/50 px-2.5 text-xs text-slate-200 hover:border-slate-500 hover:text-white sm:px-3 sm:text-sm"
      >
        <CreditCard className="size-4" aria-hidden />
        <span className="hidden sm:inline">Pricing</span>
      </Link>
      <button
        type="button"
        onClick={() => void signOut({ callbackUrl: "/" })}
        className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-slate-600 px-2.5 text-xs text-slate-300 hover:bg-slate-800 sm:px-3 sm:text-sm"
      >
        <LogOut className="size-4" aria-hidden />
        <span className="hidden sm:inline">Sign out</span>
      </button>
    </div>
  );
}
