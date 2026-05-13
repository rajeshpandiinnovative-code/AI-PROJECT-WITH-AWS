"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Activity, Award, Layers, Ghost, Wifi, WifiOff,
  Database, BarChart3, Zap, BookOpen,
} from "lucide-react";

import { modulePillars } from "@/src/lib/modules";
import { isMockApiMode } from "@/src/lib/api-mode";
import { getMockDatabaseStats, getMockPillarStats, getLocalSocialProof } from "@/src/lib/MockDataEngine";
import type { MockDatabaseStats, PillarStat } from "@/src/types/modules";
import type { LocalSocialProof } from "@/src/lib/MockDataEngine";
import { ModuleCard } from "./ModuleCard";
import { GhostModeFooter } from "./GhostModeFooter";
import { GuidedTour } from "./GuidedTour";
import { LivePulse } from "./LivePulse";

const PILLAR_META: Record<string, { icon: typeof Users; color: string; gradient: string }> = {
  "pillar-a": {
    icon: BookOpen,
    color: "text-cyan-400",
    gradient: "from-cyan-500/20 via-cyan-500/5 to-transparent",
  },
  "pillar-b": {
    icon: Zap,
    color: "text-emerald-400",
    gradient: "from-emerald-500/20 via-emerald-500/5 to-transparent",
  },
  "pillar-c": {
    icon: Layers,
    color: "text-violet-400",
    gradient: "from-violet-500/20 via-violet-500/5 to-transparent",
  },
  "pillar-d": {
    icon: Activity,
    color: "text-teal-400",
    gradient: "from-teal-500/20 via-teal-500/5 to-transparent",
  },
};

function StatCard({ icon: Icon, label, value, sub, color, delay }: {
  icon: typeof Users;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay }}
      className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 backdrop-blur-xl"
    >
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.05] ${color}`}>
          <Icon className="h-5 w-5" strokeWidth={1.8} />
        </div>
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">{label}</p>
          <p className="text-xl font-bold text-white">{value}</p>
          {sub && <p className="text-[10px] text-slate-500">{sub}</p>}
        </div>
      </div>
    </motion.div>
  );
}

export function DashboardMain() {
  const mockMode = isMockApiMode();
  const [dbStats, setDbStats] = useState<MockDatabaseStats | null>(null);
  const [pillarStats, setPillarStats] = useState<PillarStat[]>([]);
  const [socialProof, setSocialProof] = useState<LocalSocialProof | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
    if (mockMode) {
      setDbStats(getMockDatabaseStats());
      setPillarStats(getMockPillarStats());
      setSocialProof(getLocalSocialProof());
    }
  }, [mockMode]);

  const totalModules = useMemo(
    () => modulePillars.reduce((sum, p) => sum + p.modules.length, 0),
    [],
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Ghost Mode Banner */}
      <AnimatePresence>
        {mockMode && hydrated && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-amber-500/20 bg-amber-500/[0.06]"
          >
            <div className="mx-auto flex max-w-7xl items-center justify-center gap-3 px-4 py-2.5 sm:px-6">
              <Ghost className="h-4 w-4 text-amber-400" />
              <p className="text-xs font-semibold text-amber-200">
                Ghost Mode Active — AWS RDS stopped, all data is simulated
              </p>
              <span className="flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                <WifiOff className="h-3 w-3" />
                Offline
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 ring-1 ring-white/10">
              <Layers className="h-6 w-6 text-cyan-300" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                AI Academy Pro
              </h1>
              <div className="flex items-center gap-3">
                <p className="text-sm text-slate-400">
                  {totalModules} Modules &middot; 4 Pillars &middot; {mockMode ? "Ghost Mode" : "Live"}
                </p>
                <LivePulse label={mockMode ? "Mock Engine" : "AWS RDS"} />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Row */}
        {dbStats && (
          <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={Users}
              label="Total Students"
              value={dbStats.totalStudents.toLocaleString()}
              sub="Simulated database"
              color="text-cyan-400"
              delay={0.1}
            />
            <StatCard
              icon={Activity}
              label="Active Today"
              value={dbStats.activeToday}
              sub="Mock session data"
              color="text-emerald-400"
              delay={0.15}
            />
            <StatCard
              icon={Award}
              label="Avg Score"
              value={`${dbStats.avgPlatformScore}%`}
              sub="Platform-wide"
              color="text-violet-400"
              delay={0.2}
            />
            <StatCard
              icon={Database}
              label="Data Source"
              value={mockMode ? "Mock Engine" : "AWS RDS"}
              sub={mockMode ? "Credit-safe mode" : "PostgreSQL"}
              color="text-amber-400"
              delay={0.25}
            />
          </div>
        )}

        {/* Local Social Proof — Srivilliputhur */}
        {socialProof && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-10 overflow-hidden rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.03] p-4 backdrop-blur-xl"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-6">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                <p className="text-xs font-medium text-emerald-200">{socialProof.localActive}</p>
              </div>
              <div className="hidden h-4 w-px bg-emerald-500/20 sm:block" />
              <p className="text-xs text-emerald-300/80">{socialProof.recentHighScore}</p>
            </div>
            <p className="mt-2 text-[10px] text-slate-500">{socialProof.institution}</p>
          </motion.div>
        )}

        {/* Top Modules Bar */}
        {dbStats && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mb-10 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 backdrop-blur-xl"
          >
            <div className="mb-4 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-slate-400" />
              <h3 className="text-sm font-semibold text-slate-300">Trending Modules</h3>
            </div>
            <div className="space-y-3">
              {dbStats.topModules.map((mod, i) => {
                const maxSessions = dbStats.topModules[0].sessions;
                const width = Math.round((mod.sessions / maxSessions) * 100);
                return (
                  <div key={mod.slug} className="flex items-center gap-3">
                    <span className="w-6 text-right text-xs font-bold text-slate-500">#{i + 1}</span>
                    <div className="flex-1">
                      <div className="mb-1 flex justify-between">
                        <span className="text-xs font-medium text-white">{mod.title}</span>
                        <span className="text-[11px] text-slate-500">{mod.sessions.toLocaleString()} sessions</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${width}%` }}
                          transition={{ duration: 0.8, delay: 0.4 + i * 0.1 }}
                          className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* 4-Pillar Module Grid */}
        <div className="space-y-12">
          {modulePillars.map((pillar, pillarIdx) => {
            const meta = PILLAR_META[pillar.id] ?? PILLAR_META["pillar-a"];
            const PillarIcon = meta.icon;
            const stat = pillarStats.find((s) => s.pillarId === pillar.id);

            return (
              <motion.section
                key={pillar.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.2 + pillarIdx * 0.1 }}
              >
                {/* Pillar Header */}
                <div className="relative mb-6 overflow-hidden rounded-2xl border border-white/[0.05] bg-white/[0.02] p-5 backdrop-blur-xl">
                  <div className={`pointer-events-none absolute inset-0 bg-gradient-to-r ${meta.gradient}`} />
                  <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <PillarIcon className={`h-5 w-5 ${meta.color}`} />
                      <div>
                        <h2 className="text-base font-bold text-white">{pillar.title}</h2>
                        <p className="text-xs text-slate-400">{pillar.subtitle}</p>
                      </div>
                    </div>
                    {stat && (
                      <div className="flex gap-4 text-[11px]">
                        <span className="text-slate-500">
                          <strong className="text-white">{stat.totalSessions.toLocaleString()}</strong> sessions
                        </span>
                        <span className="text-slate-500">
                          Avg <strong className="text-white">{stat.avgScore}%</strong>
                        </span>
                        <span className="text-slate-500">
                          Top: <strong className="text-white">{stat.topModule}</strong>
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Module Cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {pillar.modules.map((mod, modIdx) => (
                    <ModuleCard
                      key={mod.slug}
                      module={mod}
                      pillarId={pillar.id}
                      index={pillarIdx * 5 + modIdx}
                    />
                  ))}
                </div>
              </motion.section>
            );
          })}
        </div>

        {/* Footer */}
        <GhostModeFooter />
      </div>

      {/* Guided Tour Overlay */}
      <GuidedTour />
    </div>
  );
}
