import Link from "next/link";
import { Home, Search } from "lucide-react";

import { MarketingNav } from "@/src/components/MarketingNav";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0F172A] text-zinc-100">
      <MarketingNav />
      <main className="mx-auto flex max-w-lg flex-col items-center px-4 py-20 text-center sm:py-28">
        <p className="text-6xl font-bold tabular-nums text-slate-600">404</p>
        <h1 className="mt-4 text-2xl font-semibold text-white sm:text-3xl">This page is not available</h1>
        <p className="mt-3 text-slate-400">
          The link may be old or mistyped. Head back to the marketing site or claim your school to open the console.
        </p>
        <div className="mt-10 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-slate-600 bg-[#1E293B] px-6 font-medium text-white transition hover:border-slate-500"
          >
            <Home className="size-4" aria-hidden />
            Home
          </Link>
          <Link
            href="/onboarding"
            className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[#10B981] px-6 font-semibold text-[#0F172A] shadow-lg shadow-emerald-900/30 transition hover:bg-[#059669]"
          >
            <Search className="size-4" aria-hidden />
            Claim School
          </Link>
        </div>
      </main>
    </div>
  );
}
