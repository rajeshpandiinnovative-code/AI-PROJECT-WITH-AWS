"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Calculator, Swords, Brain, Hand, GraduationCap, Languages,
  TrendingUp, ScanSearch, LayoutDashboard, MessageSquareText,
  Mic, NotebookPen, Sparkles, Speech, Code2, MonitorSmartphone,
  Wallet, BadgeCheck, Clock3, type LucideIcon,
} from "lucide-react";

import type { ModuleIconKey, LearningModule } from "@/src/lib/modules";

const ICON_MAP: Record<ModuleIconKey, LucideIcon> = {
  "calculator": Calculator,
  "swords": Swords,
  "brain": Brain,
  "hand": Hand,
  "graduation-cap": GraduationCap,
  "languages": Languages,
  "chart-line": TrendingUp,
  "scan-search": ScanSearch,
  "layout-dashboard": LayoutDashboard,
  "message-square-text": MessageSquareText,
  "mic": Mic,
  "notebook-pen": NotebookPen,
  "sparkles": Sparkles,
  "speech": Speech,
  "code2": Code2,
  "monitor-smartphone": MonitorSmartphone,
  "wallet": Wallet,
  "badge-check": BadgeCheck,
  "clock3": Clock3,
};

const ACCENT_COLORS: Record<string, { border: string; glow: string; icon: string; badge: string }> = {
  "pillar-a": {
    border: "border-cyan-500/20 hover:border-cyan-400/50",
    glow: "hover:shadow-cyan-500/10",
    icon: "text-cyan-400",
    badge: "bg-cyan-500/10 text-cyan-300",
  },
  "pillar-b": {
    border: "border-emerald-500/20 hover:border-emerald-400/50",
    glow: "hover:shadow-emerald-500/10",
    icon: "text-emerald-400",
    badge: "bg-emerald-500/10 text-emerald-300",
  },
  "pillar-c": {
    border: "border-violet-500/20 hover:border-violet-400/50",
    glow: "hover:shadow-violet-500/10",
    icon: "text-violet-400",
    badge: "bg-violet-500/10 text-violet-300",
  },
  "pillar-d": {
    border: "border-teal-500/20 hover:border-teal-400/50",
    glow: "hover:shadow-teal-500/10",
    icon: "text-teal-400",
    badge: "bg-teal-500/10 text-teal-300",
  },
};

type ModuleCardProps = {
  module: LearningModule;
  pillarId: string;
  index: number;
};

export function ModuleCard({ module, pillarId, index }: ModuleCardProps) {
  const Icon = ICON_MAP[module.iconKey] ?? Sparkles;
  const colors = ACCENT_COLORS[pillarId] ?? ACCENT_COLORS["pillar-a"];

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: "easeOut" }}
    >
      <Link href={`/modules/${module.slug}`} className="group block h-full">
        <div
          className={`
            relative h-full overflow-hidden rounded-2xl border
            bg-white/[0.03] p-5 backdrop-blur-xl
            shadow-lg transition-all duration-300
            hover:bg-white/[0.06] hover:shadow-2xl
            ${colors.border} ${colors.glow}
          `}
        >
          {/* Glassmorphism gradient overlay */}
          <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-white/[0.04] via-transparent to-transparent" />

          <div className="relative z-10">
            <div className="flex items-start justify-between">
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-xl bg-white/[0.06] ring-1 ring-white/10 ${colors.icon}`}
              >
                <Icon className="h-5 w-5" strokeWidth={1.8} />
              </div>
              <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${colors.badge}`}>
                Active
              </span>
            </div>

            <h3 className="mt-4 text-sm font-bold text-white group-hover:text-white/90">
              {module.title}
            </h3>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-400 line-clamp-2">
              {module.description}
            </p>

            <div className="mt-4 flex items-center gap-1.5 text-[11px] font-medium text-slate-500 group-hover:text-slate-400 transition-colors">
              <span>Open Module</span>
              <svg className="h-3 w-3 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
