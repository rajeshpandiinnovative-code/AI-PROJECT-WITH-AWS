"use client";

import Link from "next/link";

import { SiteBrandLogo } from "@/src/components/landing/SiteBrandLogo";
import { showDemoEntrypoints } from "@/src/lib/show-demo";

type Props = {
  /** Subtle emphasis for the page the user is on */
  activeAuth?: "demo" | "login" | "none";
  /** When false, logo only (no Login / Register). Landing uses this for a clean marketing header. */
  showAuthNav?: boolean;
  /** When false, hide the left wordmark — use when the logo sits inside the hero artwork instead. */
  showBrandInHeader?: boolean;
};

const linkBase =
  "rounded-md px-2 py-1 text-center text-[10px] font-semibold transition sm:px-2.5 sm:text-[11px]";

export function PublicSiteHeader({ activeAuth = "none", showAuthNav = true, showBrandInHeader = true }: Props) {
  const demoActive = activeAuth === "demo";
  const loginActive = activeAuth === "login";
  const showDemo = showDemoEntrypoints();
  /** Paid signup lives at `/register/account`; primary entry uses the existing demo page when enabled. */
  const registerHref = showDemo ? "/login?mode=demo" : "/register/account";

  return (
    <header className="border-b border-slate-800/80 bg-slate-950/90 py-0.5 backdrop-blur">
      {/* Single row: logo left, Register / Login always top-right */}
      <div
        className={`mx-auto flex max-w-6xl items-center gap-2 px-3 py-1.5 sm:gap-4 sm:px-4 ${showBrandInHeader ? "justify-between" : "justify-end"}`}
      >
        {showBrandInHeader ? (
          <Link
            href="/"
            title="AI Coaching Centre — Smart Learning. Better Future."
            className="inline-flex min-w-0 flex-1 items-center pr-2 transition hover:opacity-95"
          >
            <SiteBrandLogo />
          </Link>
        ) : null}
        {showAuthNav ? (
          <nav
            className="flex shrink-0 items-center justify-end gap-1.5 sm:gap-2"
            aria-label="Account"
          >
            <Link
              href={registerHref}
              className={`${linkBase} ${
                showDemo
                  ? demoActive
                    ? "bg-cyan-500/20 text-cyan-200 ring-1 ring-cyan-400/40"
                    : "bg-cyan-500 text-slate-950 hover:bg-cyan-400"
                  : "border border-emerald-600/55 bg-emerald-950/35 text-emerald-100 hover:border-emerald-400/70 hover:bg-emerald-950/55 hover:text-white"
              }`}
            >
              Register
            </Link>
            <Link
              href="/login"
              className={`${linkBase} ${
                loginActive
                  ? "border border-cyan-400/50 bg-slate-800/80 text-cyan-200"
                  : "border border-slate-600 text-slate-100 hover:border-cyan-400 hover:text-cyan-200"
              }`}
            >
              Login
            </Link>
          </nav>
        ) : null}
      </div>
    </header>
  );
}
