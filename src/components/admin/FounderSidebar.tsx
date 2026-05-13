"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

import { isMockApiMode } from "@/src/lib/api-mode";
import {
  LAUNCH_PHONE_DISPLAY,
  LAUNCH_PHONE_E164,
  LAUNCH_WHATSAPP_URL,
} from "@/src/lib/marketing-constants";

const ITEMS = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/schools", label: "School Management" },
  { href: "/admin/analytics", label: "AI Analytics" },
  { href: "/admin/billing", label: "Billing" },
  { href: "/admin/logs", label: "System Logs" },
];

const QUICK_JUMP = [
  { href: "/management/dashboard", label: "Management" },
  { href: "/teacher/dashboard", label: "Teacher" },
  { href: "/student", label: "Student" },
  { href: "/parent/dashboard", label: "Parent" },
  { href: "/school-admin", label: "School Admin" },
  { href: "/school/dashboard", label: "School Ops Console" },
];

export function FounderSidebar() {
  const pathname = usePathname();
  const mockMode = isMockApiMode();
  const [jumpOpen, setJumpOpen] = useState(false);

  return (
    <aside className="space-y-4">
      <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">Founder&apos;s Command Center</p>

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
      </div>

      <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-4">
        <button
          type="button"
          onClick={() => setJumpOpen((prev) => !prev)}
          className="flex w-full items-center justify-between text-xs font-semibold uppercase tracking-[0.2em] text-amber-300 transition"
        >
          Quick Jump
          <ChevronDown
            className={`size-3.5 transition-transform ${jumpOpen ? "rotate-180" : ""}`}
            aria-hidden
          />
        </button>
        {jumpOpen ? (
          <nav className="mt-3 space-y-1.5">
            {QUICK_JUMP.map((item) => {
              const active = pathname.startsWith(item.href.replace(/\/dashboard$/, ""));
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
        ) : null}
      </div>

      <div className="rounded-xl border border-amber-500/25 bg-amber-950/20 p-4 ring-1 ring-amber-400/20">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-300/90">Founder support</p>
        <a
          href={`tel:${LAUNCH_PHONE_E164}`}
          className="mt-2 block font-mono text-sm font-semibold text-white underline-offset-2 hover:underline"
        >
          {LAUNCH_PHONE_DISPLAY}
        </a>
        <a
          href={LAUNCH_WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 block text-[11px] font-semibold text-emerald-300 underline-offset-2 hover:underline"
        >
          WhatsApp {LAUNCH_PHONE_DISPLAY}
        </a>
      </div>
    </aside>
  );
}
