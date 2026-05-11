"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/schools", label: "School Management" },
  { href: "/admin/analytics", label: "AI Analytics" },
  { href: "/admin/billing", label: "Billing" },
  { href: "/admin/logs", label: "System Logs" },
];

export function FounderSidebar() {
  const pathname = usePathname();
  return (
    <aside className="rounded-xl border border-slate-700 bg-slate-900/70 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">Founder&apos;s Command Center</p>
      <nav className="mt-4 space-y-2">
        {ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-md px-3 py-2 text-sm ${
                active ? "bg-amber-500/20 text-amber-200" : "text-slate-300 hover:bg-slate-800"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
