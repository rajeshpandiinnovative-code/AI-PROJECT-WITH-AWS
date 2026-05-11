"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  CreditCard,
  LayoutDashboard,
  Network,
  Users,
} from "lucide-react";

type NavItem = { href: string; label: string; icon: LucideIcon; hash?: string };

const items: NavItem[] = [
  { href: "/management", label: "Dashboard", icon: LayoutDashboard },
  { href: "/management/staff-management", label: "Staff Directory", icon: Users },
  { href: "/school/dashboard", label: "Academic Analytics", icon: BarChart3 },
  { href: "/pricing", label: "Billing", icon: CreditCard },
  { href: "/management/staff-management", label: "Account Delegation", icon: Network, hash: "#delegation" },
];

export function ManagementSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-full shrink-0 flex-col border-b border-slate-800/80 bg-slate-950 lg:w-60 lg:border-b-0 lg:border-r">
      <div className="border-b border-slate-800/80 px-4 py-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-indigo-300/90">Institution</p>
        <p className="mt-1 text-sm font-semibold text-white">Management Console</p>
        <p className="mt-1 text-xs text-slate-500">Executive slate · tenant scoped</p>
      </div>
      <nav className="flex flex-1 flex-row gap-1 overflow-x-auto px-2 py-3 lg:flex-col lg:overflow-visible lg:px-3">
        {items.map(({ href, label, icon: Icon, hash }) => {
          const fullHref = hash ? `${href}${hash}` : href;
          const active =
            href === "/management"
              ? pathname === "/management" || pathname === "/management/"
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
    </aside>
  );
}
