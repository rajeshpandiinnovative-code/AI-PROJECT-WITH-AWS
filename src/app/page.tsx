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

const CONTACT_NUMBER = "9535761292";
const CONTACT_WHATSAPP = "https://wa.me/919535761292?text=Hello%20AI%20Academy%20Pro%20team,%20I%20want%20to%20start%20the%20pilot.";

type ModuleCard = {
  title: string;
  icon: LucideIcon;
  description: string;
};

type Pillar = {
  id: string;
  title: string;
  subtitle: string;
  accentClass: string;
  ringClass: string;
  modules: ModuleCard[];
};

const roleNav = [
  { label: "Students", href: "#students" },
  { label: "Parents", href: "#parents" },
  { label: "Schools", href: "#schools" },
];

const pillars: Pillar[] = [
  {
    id: "pillar-a",
    title: "Pillar A: Academic & Competitive Excellence",
    subtitle: "Build score, speed, and exam confidence at scale.",
    accentClass: "from-cyan-500/20 via-blue-500/10 to-slate-950",
    ringClass: "ring-cyan-400/30",
    modules: [
      { title: "Vedic Maths", icon: Calculator, description: "Fast mental arithmetic techniques." },
      { title: "Speed Tricks", icon: Swords, description: "Timed methods for quick solving." },
      { title: "Memory Techniques", icon: Brain, description: "Retention frameworks for recall." },
      { title: "Handwriting Improvement", icon: Hand, description: "Readable writing with structure." },
      { title: "NEET/JEE Daily MCQs", icon: GraduationCap, description: "Practice with daily challenge sets." },
      { title: "TNPSC Prep", icon: Languages, description: "Localized preparation for Tamil Nadu exams." },
      { title: "Rank Predictor", icon: ChartLine, description: "Forecast rank from performance trends." },
      { title: "Weak Area Detection", icon: ScanSearch, description: "Pinpoint topic-level performance gaps." },
    ],
  },
  {
    id: "pillar-b",
    title: "Pillar B: The Viral AI Engine",
    subtitle: "The smart layer that drives retention and referrals.",
    accentClass: "from-emerald-500/20 via-blue-500/10 to-slate-950",
    ringClass: "ring-emerald-400/30",
    modules: [
      { title: "AI Study Planner", icon: LayoutDashboard, description: "Adaptive weekly study plans." },
      { title: "Homework Helper", icon: MessageSquareText, description: "Step-by-step homework guidance." },
      { title: "Voice Tutor", icon: Mic, description: "Voice-based explanations in seconds." },
      { title: "AI Notes Generator", icon: NotebookPen, description: "Auto-generated concise notes." },
      { title: "AI Quiz Generator", icon: Sparkles, description: "Instant quizzes by chapter or topic." },
    ],
  },
  {
    id: "pillar-c",
    title: "Pillar C: Skill & Future Readiness",
    subtitle: "Beyond marks: communication, tech, and money skills.",
    accentClass: "from-violet-500/20 via-blue-500/10 to-slate-950",
    ringClass: "ring-violet-400/30",
    modules: [
      { title: "Public Speaking", icon: Speech, description: "Confidence-building speaking drills." },
      { title: "Coding for Kids", icon: Code2, description: "Beginner-friendly logic and coding tracks." },
      { title: "Robotics", icon: MonitorSmartphone, description: "Hands-on STEM exploration modules." },
      { title: "Financial Literacy", icon: Wallet, description: "Budgeting, saving, and practical finance." },
    ],
  },
  {
    id: "pillar-d",
    title: "Pillar D: Wellness & Productivity",
    subtitle: "Sustainable performance through healthy routines.",
    accentClass: "from-teal-500/20 via-blue-500/10 to-slate-950",
    ringClass: "ring-teal-400/30",
    modules: [
      { title: "Focus Exercises", icon: Brain, description: "Daily concentration boosters." },
      { title: "Exam Stress Management", icon: BadgeCheck, description: "Guided routines for calm preparation." },
      { title: "Habit Tracker", icon: Clock3, description: "Track consistency and discipline streaks." },
      { title: "Screen Time Monitor", icon: MonitorSmartphone, description: "Balanced digital learning windows." },
    ],
  },
];

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
                href="/onboarding"
                className="rounded-lg border border-emerald-400 px-5 py-3 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-400/10"
              >
                Start Pilot Onboarding
              </Link>
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
          {pillars.map((pillar) => (
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
                {pillar.modules.map((module) => (
                  <motion.div
                    variants={itemMotion}
                    key={module.title}
                    className="rounded-xl border border-slate-700/70 bg-slate-900/75 p-4"
                  >
                    <module.icon className="size-6 text-cyan-300" aria-hidden />
                    <h4 className="mt-3 text-base font-semibold text-white">{module.title}</h4>
                    <p className="mt-1 text-sm text-slate-300">{module.description}</p>
                  </motion.div>
                ))}
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
              Srivilliputhur school outreach active. TNPSC-focused learning pathways and school pilots are open for quick deployment.
            </motion.p>
            <motion.p variants={itemMotion} className="mt-6 text-base font-semibold text-emerald-300">
              Direct Pilot Support: Call/WhatsApp {CONTACT_NUMBER}
            </motion.p>
            <motion.div variants={itemMotion} className="mt-5 flex flex-wrap gap-3">
              <a
                href={`tel:${CONTACT_NUMBER}`}
                className="rounded-lg bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
              >
                Call Pilot Team
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
