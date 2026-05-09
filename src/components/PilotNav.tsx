"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { LayoutDashboard, LogOut, ScanLine } from "lucide-react";

/**
 * Signed-in console shortcuts (landing header avoids duplicating Claim School).
 */
export function PilotNav() {
  const { status } = useSession();

  if (status !== "authenticated") {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
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
