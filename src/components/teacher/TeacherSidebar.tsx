"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, ScanLine } from "lucide-react";

const items = [
  { href: "/teacher/dashboard", label: "Scan & grade", icon: ScanLine },
  { href: "/school/dashboard", label: "School analytics", icon: BarChart3 },
] as const;

export function TeacherSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-full shrink-0 flex-col border-b border-slate-800/80 bg-slate-950 lg:w-56 lg:border-b-0 lg:border-r">
      <div className="border-b border-slate-800/80 px-4 py-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-teal-300/90">Classroom</p>
        <p className="mt-1 text-sm font-semibold text-white">Teacher workspace</p>
        <p className="mt-1 text-xs text-slate-500">OCR · tenant scoped</p>
      </div>
      <nav className="flex flex-1 flex-row gap-1 overflow-x-auto px-2 py-3 lg:flex-col lg:overflow-visible lg:px-3">
        {items.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/teacher/dashboard"
              ? pathname === "/teacher/dashboard" || pathname === "/teacher/dashboard/"
              : pathname.startsWith("/school/dashboard");
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition whitespace-nowrap ${
                active
                  ? "bg-teal-500/15 text-teal-100 ring-1 ring-teal-400/35"
                  : "text-slate-400 hover:bg-slate-900 hover:text-slate-100"
              }`}
            >
              <Icon className="size-4 shrink-0 text-teal-400" aria-hidden />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
