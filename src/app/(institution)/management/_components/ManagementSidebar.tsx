"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import type { LucideIcon } from "lucide-react";
import Lottie from "lottie-react";
import {
  BarChart3,
  CreditCard,
  LayoutDashboard,
  Network,
  Users,
} from "lucide-react";

import scanningAnimation from "@/src/assets/lottie/scanning.json";
import { isMockApiMode } from "@/src/lib/api-mode";
import {
  LAUNCH_PHONE_DISPLAY,
  LAUNCH_PHONE_E164,
  LAUNCH_WHATSAPP_URL,
} from "@/src/lib/marketing-constants";

type NavItem = { href: string; label: string; icon: LucideIcon; hash?: string };

const items: NavItem[] = [
  { href: "/management/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/management/staff-management", label: "Staff Directory", icon: Users },
  { href: "/school/dashboard", label: "Academic Analytics", icon: BarChart3 },
  { href: "/pricing", label: "Billing", icon: CreditCard },
  { href: "/management/staff-management", label: "Account Delegation", icon: Network, hash: "#delegation" },
];

export function ManagementSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const showTrialPulse = session?.user?.role === "MANAGEMENT";
  const mockMode = isMockApiMode();

  return (
    <aside className="flex w-full shrink-0 flex-col border-b border-slate-800/80 bg-slate-950 lg:min-h-screen lg:w-60 lg:border-b-0 lg:border-r">
      <div className="border-b border-slate-800/80 px-4 py-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-indigo-300/90">Pinnacle Software Solution</p>
        <p className="mt-1 text-sm font-semibold text-white">AI Academy Pro · Management</p>
        <p className="mt-1 text-xs text-slate-500">Executive slate · tenant scoped</p>
        <div
          className={`mt-3 rounded-full border px-3 py-1.5 text-center text-[11px] font-semibold leading-snug shadow-sm ${
            mockMode
              ? "border-amber-500/50 bg-amber-400/15 text-amber-100 ring-1 ring-amber-400/25"
              : "border-emerald-500/40 bg-emerald-950/50 text-emerald-100 ring-1 ring-emerald-500/20"
          }`}
          role="status"
          aria-label={mockMode ? "Mock API mode, credits safe" : "Live API mode"}
        >
          {mockMode ? "⚠️ Mock Mode: Credits Safe" : "🌐 Live Mode: AI Active"}
        </div>
      </div>
      <nav className="flex flex-1 flex-row gap-1 overflow-x-auto px-2 py-3 lg:flex-col lg:overflow-visible lg:px-3">
        {items.map(({ href, label, icon: Icon, hash }) => {
          const fullHref = hash ? `${href}${hash}` : href;
          const active =
            href === "/management/dashboard"
              ? pathname === "/management/dashboard" || pathname === "/management/dashboard/"
              : href === "/school/dashboard"
                ? pathname.startsWith("/school/dashboard")
                : href === "/pricing"
                  ? pathname.startsWith("/pricing")
                  : pathname.startsWith("/management/staff-management");
          return (
            <Link
              key={`${href}-${label}`}
              href={fullHref}
              className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition whitespace-nowrap ${
                active
                  ? "bg-indigo-500/15 text-amber-200 ring-1 ring-amber-400/30"
                  : "text-slate-400 hover:bg-slate-900 hover:text-slate-100"
              }`}
            >
              <Icon className="size-4 shrink-0 text-indigo-400" aria-hidden />
              {label}
            </Link>
          );
        })}
      </nav>
      {showTrialPulse ? (
        <div className="mt-auto border-t border-slate-800/80 px-3 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-300/90">Institution support</p>
          <div className="mt-2 flex items-center gap-2 rounded-lg border border-amber-500/25 bg-amber-950/20 px-2.5 py-2 ring-1 ring-amber-400/20 animate-pulse">
            <div className="size-9 shrink-0 overflow-hidden rounded-md bg-slate-900/80">
              <Lottie animationData={scanningAnimation} loop className="size-9 scale-110" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-amber-100/95">Pinnacle Software Solution</p>
              <a
                href={`tel:${LAUNCH_PHONE_E164}`}
                className="block truncate font-mono text-sm font-semibold text-white underline-offset-2 hover:underline"
              >
                Call {LAUNCH_PHONE_DISPLAY}
              </a>
              <a
                href={LAUNCH_WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 block truncate text-[11px] font-semibold text-emerald-300 underline-offset-2 hover:underline"
              >
                WhatsApp {LAUNCH_PHONE_DISPLAY}
              </a>
            </div>
          </div>
        </div>
      ) : null}
    </aside>
  );
}
