"use client";

import { Phone, MessageCircle } from "lucide-react";
import { LAUNCH_PHONE_DISPLAY, LAUNCH_WHATSAPP_URL } from "@/src/lib/marketing-constants";

export function GhostModeFooter() {
  return (
    <footer className="mt-16 border-t border-white/[0.06] pt-8 pb-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
          <div className="text-center sm:text-left">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Powering Education by
            </p>
            <p className="mt-1 text-sm font-bold text-white">
              Pinnacle Software Solution
            </p>
          </div>

          <div className="flex items-center gap-4">
            <a
              href={`tel:+91${LAUNCH_PHONE_DISPLAY}`}
              className="flex items-center gap-2 rounded-full border border-slate-700/60 bg-white/[0.03] px-4 py-2 text-xs font-medium text-slate-300 backdrop-blur-sm transition hover:border-slate-600 hover:bg-white/[0.06]"
            >
              <Phone className="h-3.5 w-3.5 text-cyan-400" />
              {LAUNCH_PHONE_DISPLAY}
            </a>
            <a
              href={LAUNCH_WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs font-medium text-emerald-300 backdrop-blur-sm transition hover:bg-emerald-500/20"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              WhatsApp
            </a>
          </div>
        </div>

        <p className="mt-6 text-center text-[11px] text-slate-600">
          AI Academy Pro &copy; {new Date().getFullYear()} &middot; Ghost Mode — All systems operational
        </p>
      </div>
    </footer>
  );
}
