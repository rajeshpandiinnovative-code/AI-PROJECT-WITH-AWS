"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileUp, Headphones, LayoutDashboard, Layers, Settings2, Users } from "lucide-react";

const links = [
  { href: "/school-admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/school-admin#students", label: "Students", icon: Users },
  { href: "/school-admin#classes", label: "Classes", icon: Layers },
  { href: "/school-admin#modules", label: "AI Module Settings", icon: Settings2 },
  { href: "/school-admin#import", label: "Data import", icon: FileUp },
  { href: "/school-admin#support", label: "Support", icon: Headphones },
] as const;

export function SchoolAdminSidebar() {
  const pathname = usePathname();
  const onDash = pathname === "/school-admin" || pathname === "/school-admin/";

  return (
    <aside className="flex w-full shrink-0 flex-col border-b border-slate-200 bg-white lg:w-56 lg:border-b-0 lg:border-r">
      <div className="border-b border-slate-200 px-4 py-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Operations</p>
        <p className="mt-1 text-sm font-semibold text-slate-900">School Admin</p>
      </div>
      <nav className="flex flex-1 flex-row gap-0.5 overflow-x-auto px-2 py-2 lg:flex-col lg:overflow-visible lg:px-0">
        {links.map(({ href, label, icon: Icon }) => {
          const isDashLink = href === "/school-admin";
          const active = isDashLink && onDash;
          return (
            <Link
              key={href + label}
              href={href}
              className={`flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium ${
                active ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              <Icon className="size-4 shrink-0 opacity-80" aria-hidden />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
