"use client";

import Link from "next/link";
import { Building2, Phone } from "lucide-react";

import { LAUNCH_WHATSAPP_URL } from "@/src/lib/marketing-constants";

/**
 * Sticky nav: logo + Claim School + Login + Demo + Contact (anchor).
 */
export function MarketingNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-[#0F172A]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-3 sm:gap-3 sm:py-4">
        <Link
          href="/"
          className="group flex min-w-0 items-center gap-2.5 font-semibold tracking-tight text-white"
          aria-label="Pinnacle Software Solution — home"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-emerald-500/35 bg-gradient-to-br from-emerald-500 to-emerald-700 text-[#0F172A] shadow-lg">
            <Building2 className="size-[1.05rem]" strokeWidth={2.25} aria-hidden />
          </span>
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-[0.75rem] font-semibold uppercase tracking-wide text-slate-400 sm:text-[0.7rem] sm:tracking-[0.12em]">
              Pinnacle
            </span>
            <span className="block truncate text-[0.85rem] text-white sm:text-[0.95rem]">Software Solution</span>
          </span>
        </Link>

        <nav
          className="flex w-full flex-wrap items-center justify-end gap-1.5 sm:w-auto sm:gap-2"
          aria-label="Primary"
        >
          <Link
            href="/visualizations"
            className="inline-flex min-h-[38px] items-center rounded-lg border border-slate-600 px-2.5 text-xs font-medium text-slate-200 hover:border-cyan-500/40 hover:text-white sm:px-3 sm:text-sm"
          >
            Charts
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex min-h-[38px] items-center rounded-lg border border-slate-600 px-2.5 text-xs font-medium text-slate-100 hover:bg-slate-800/90 sm:px-3 sm:text-sm"
          >
            Login
          </Link>
          <a
            href={LAUNCH_WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[38px] items-center rounded-lg bg-white/10 px-2.5 text-xs font-semibold text-white hover:bg-white/15 sm:px-3 sm:text-sm"
          >
            Demo
          </a>
          <Link
            href="#contact"
            className="inline-flex min-h-[38px] items-center gap-1 rounded-lg border border-slate-600 px-2.5 text-xs font-medium text-slate-200 hover:border-emerald-500/40 hover:text-white sm:px-3 sm:text-sm"
          >
            <Phone className="size-3.5 sm:size-4" aria-hidden />
            <span className="hidden sm:inline">Contact</span>
            <span className="sm:hidden">Call</span>
          </Link>
          <Link
            href="/onboarding"
            className="inline-flex min-h-[38px] items-center rounded-lg bg-emerald-500 px-2.5 text-xs font-semibold text-[#0F172A] shadow-md hover:bg-emerald-400 sm:px-3 sm:text-sm"
          >
            Claim School
          </Link>
        </nav>
      </div>
    </header>
  );
}
