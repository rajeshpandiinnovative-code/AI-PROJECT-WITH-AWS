"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  BadgeCheck,
  Brain,
  Calculator,
  ChartLine,
  Clock3,
  Code2,
  GraduationCap,
  Hand,
  Languages,
  LayoutDashboard,
  Medal,
  MessageSquareText,
  Mic,
  MonitorSmartphone,
  NotebookPen,
  ScanSearch,
  Sparkles,
  Speech,
  Swords,
  Trophy,
  UserCircle2,
  Wallet,
} from "lucide-react";
import { DemoLeadCapture } from "@/src/components/DemoLeadCapture";
import { modulePillars, type LearningModule, type ModulePillar } from "@/src/lib/modules";

const CONTACT_NUMBER = "9535761292";
const CONTACT_WHATSAPP = "https://wa.me/919535761292?text=Hello%20AI%20Academy%20Pro%20team,%20I%20want%20to%20start%20the%20national%20launch.";

const roleNav = [
  { label: "Students", href: "#students" },
  { label: "Parents", href: "#parents" },
  { label: "Schools", href: "#schools" },
];

const iconMap: Record<string, LucideIcon> = {
  calculator: Calculator,
  swords: Swords,
  brain: Brain,
  hand: Hand,
  "graduation-cap": GraduationCap,
  languages: Languages,
  "chart-line": ChartLine,
  "scan-search": ScanSearch,
  "layout-dashboard": LayoutDashboard,
  "message-square-text": MessageSquareText,
  mic: Mic,
  "notebook-pen": NotebookPen,
  sparkles: Sparkles,
  speech: Speech,
  code2: Code2,
  "monitor-smartphone": MonitorSmartphone,
  wallet: Wallet,
  "badge-check": BadgeCheck,
  clock3: Clock3,
};

function iconForModule(module: LearningModule): LucideIcon {
  return iconMap[module.iconKey] ?? Sparkles;
}

const containerMotion: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      staggerChildren: 0.08,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const itemMotion: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

export default function Home() {
  return (
    <main className="min-h-screen scroll-smooth bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <a href="#top" className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-300">
            <Sparkles className="size-4" />
            AI Academy Pro
          </a>
          <nav className="flex items-center gap-2 sm:gap-3">
            {roleNav.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="rounded-full border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-cyan-400 hover:text-cyan-300"
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <section id="top" className="border-b border-slate-800">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <motion.div
            variants={containerMotion}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.25 }}
            className="max-w-4xl"
          >
            <motion.p variants={itemMotion} className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-300">
              High Velocity Learning Ecosystem
            </motion.p>
            <motion.h1 variants={itemMotion} className="mt-4 text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
              Single-Page AI Academy Pro Experience for Students, Parents, and Schools.
            </motion.h1>
            <motion.p variants={itemMotion} className="mt-6 max-w-3xl text-base text-slate-300 sm:text-lg">
              Acknowledge and forge the AI Academy Pro ecosystem now. Launch a modular growth engine that combines academic outcomes, AI-driven engagement, life skills, and wellness in one scroll-ready experience.
            </motion.p>
            <motion.div variants={itemMotion} className="mt-8 flex flex-wrap gap-3">
              <a
                href="#pillars"
                className="rounded-lg bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
              >
                Explore Modules
              </a>
              <Link
                href="/visualizations"
                className="rounded-lg border border-cyan-400/60 px-5 py-3 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-400/10"
              >
                Insight charts
              </Link>
              <Link
                href="/onboarding"
                className="rounded-lg border border-emerald-400 px-5 py-3 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-400/10"
              >
                Start School Onboarding
              </Link>
            </motion.div>
            <motion.div variants={itemMotion}>
              <DemoLeadCapture />
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section id="pillars" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <motion.div
          variants={containerMotion}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.1 }}
        >
          <motion.h2 variants={itemMotion} className="text-3xl font-bold text-white sm:text-4xl">
            Section 1: The Core Pillars
          </motion.h2>
          <motion.p variants={itemMotion} className="mt-3 max-w-3xl text-slate-300">
            Four focused pillars, each delivered in a responsive 3-column module grid that stacks to one column on mobile.
          </motion.p>
        </motion.div>

        <div className="mt-10 space-y-8">
          {modulePillars.map((pillar: ModulePillar) => (
            <motion.article
              key={pillar.id}
              id={pillar.id}
              variants={containerMotion}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
              className={`rounded-2xl border border-slate-800 bg-gradient-to-br ${pillar.accentClass} p-6 ring-1 ${pillar.ringClass}`}
            >
              <motion.h3 variants={itemMotion} className="text-2xl font-semibold text-white">
                {pillar.title}
              </motion.h3>
              <motion.p variants={itemMotion} className="mt-2 text-slate-300">
                {pillar.subtitle}
              </motion.p>

              <motion.div variants={containerMotion} className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {pillar.modules.map((module) => {
                  const Icon = iconForModule(module);

                  return (
                    <motion.div
                      variants={itemMotion}
                      key={module.title}
                      className="rounded-xl border border-slate-700/70 bg-slate-900/75 p-4"
                    >
                      <Icon className="size-6 text-cyan-300" aria-hidden />
                      <h4 className="mt-3 text-base font-semibold text-white">{module.title}</h4>
                      <p className="mt-1 text-sm text-slate-300">{module.description}</p>
                      <p className="mt-2 text-xs text-emerald-300">{module.outcome}</p>
                      <Link
                        href={`/modules/${module.slug}`}
                        className="mt-3 inline-flex text-xs font-semibold text-cyan-300 hover:text-cyan-200"
                      >
                        Open module
                      </Link>
                    </motion.div>
                  );
                })}
              </motion.div>
            </motion.article>
          ))}
        </div>
      </section>

      <section id="students" className="border-y border-slate-800 bg-slate-900/60">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <motion.div
            variants={containerMotion}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            className="grid gap-8 lg:grid-cols-2"
          >
            <motion.div variants={itemMotion}>
              <h2 className="text-3xl font-bold text-white sm:text-4xl">Section 2: The Engagement Engine</h2>
              <p className="mt-3 text-slate-300">
                A viral dashboard layer designed to keep students active, motivate parents, and give schools measurable participation signals.
              </p>
            </motion.div>
            <motion.div variants={itemMotion} className="rounded-xl border border-emerald-400/40 bg-slate-950/80 p-5">
              <p className="text-sm font-semibold text-emerald-300">Dashboard Preview</p>
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-900 p-3">
                  <div className="inline-flex items-center gap-2 text-sm text-slate-200">
                    <Trophy className="size-4 text-cyan-300" /> XP / Points System
                  </div>
                  <span className="text-xs font-medium text-emerald-300">Live Leaderboards</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-900 p-3">
                  <div className="inline-flex items-center gap-2 text-sm text-slate-200">
                    <Medal className="size-4 text-cyan-300" /> Learning Streaks
                  </div>
                  <span className="text-xs font-medium text-emerald-300">Achievement Badges</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-900 p-3">
                  <div className="inline-flex items-center gap-2 text-sm text-slate-200">
                    <UserCircle2 className="size-4 text-cyan-300" /> AI Avatar Assistant
                  </div>
                  <span className="text-xs font-medium text-emerald-300">24x7 Mentor Mode</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section id="parents" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <motion.div
          variants={containerMotion}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.25 }}
          className="rounded-2xl border border-slate-800 bg-slate-900 p-6"
        >
          <motion.h3 variants={itemMotion} className="text-xl font-semibold text-white">
            Parent Value: Immediate Problem Solving
          </motion.h3>
          <motion.p variants={itemMotion} className="mt-2 text-slate-300">
            The Viral AI Engine groups planner, homework support, voice tutor, and AI content generation into one clear reason for parent sign-up and referrals.
          </motion.p>
        </motion.div>
      </section>

      <footer id="schools" className="border-t border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <motion.div
            variants={containerMotion}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.3 }}
            className="rounded-2xl border border-cyan-500/30 bg-slate-900 p-7"
          >
            <motion.h2 variants={itemMotion} className="text-2xl font-bold text-white sm:text-3xl">
              Section 3: The Contact Hub
            </motion.h2>
            <motion.p variants={itemMotion} className="mt-3 max-w-3xl text-slate-300">
              Nationwide school onboarding is active. TNPSC-focused pathways remain available as part of the broader India
              launch. Preview insight charts anytime on{" "}
              <Link href="/visualizations" className="text-cyan-400 underline underline-offset-2 hover:text-cyan-300">
                /visualizations
              </Link>
              .
            </motion.p>
            <motion.p variants={itemMotion} className="mt-6 text-base font-semibold text-emerald-300">
              Direct Launch Support: Call/WhatsApp {CONTACT_NUMBER}
            </motion.p>
            <motion.div variants={itemMotion} className="mt-5 flex flex-wrap gap-3">
              <a
                href={`tel:${CONTACT_NUMBER}`}
                className="rounded-lg bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
              >
                Call Launch Team
              </a>
              <a
                href={CONTACT_WHATSAPP}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border border-emerald-400 px-5 py-3 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-400/10"
              >
                WhatsApp Support
              </a>
            </motion.div>
          </motion.div>
        </div>
      </footer>
    </main>
  );
}
