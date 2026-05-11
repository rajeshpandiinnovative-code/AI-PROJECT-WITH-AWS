import Link from "next/link";
import type { ReactNode } from "react";

import { FounderSidebar } from "@/src/components/admin/FounderSidebar";
import { requireFounder } from "@/src/lib/founder-access";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireFounder();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-950/90">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4">
          <Link href="/" className="text-sm text-slate-400 hover:text-white">
            ← Home
          </Link>
          <form action="/admin/dashboard" className="w-full max-w-xl">
            <input
              type="search"
              name="q"
              placeholder="Global Search: student or teacher name, phone, school..."
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-500"
            />
          </form>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400">Super Admin</p>
        </div>
      </header>
      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[260px_1fr]">
        <FounderSidebar />
        <section>{children}</section>
      </main>
    </div>
  );
}
