"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

import { showDemoEntrypoints } from "@/src/lib/show-demo";

const SLIDES_BASE = [
  "Find & claim your school in our national directory—UDISE-aware, ready for rollout.",
  "Instant OCR on handwritten answer sheets—Tamil & English classroom handwriting supported.",
  "Intelligent grading and analytics delivered in seconds—not overnight batch jobs.",
  "Browse every learning module from one catalog: Vedic maths, quizzes, voice tutor, and more.",
  "Demo login lets families try the experience with local details—no tenant setup required.",
  "Role-aware dashboards for teachers, school admins, and parents—same data, clearer views.",
  "Homework helper, AI notes, and study planners keep momentum between class days.",
  "Intervention digests highlight who needs help early—before scores become surprises.",
  "Built for India-wide deployment: secure headers, tenant isolation, and pilot-friendly billing.",
];

const SLIDE_DEMO_ALT =
  "Registered families and staff use secure sign-in—tenant-aware views without extra setup friction.";

const WORKFLOW_SLIDE_INTERVAL_MS = 4800;

type WorkflowSliderProps = {
  className?: string;
};

export function WorkflowSlider({ className }: WorkflowSliderProps) {
  const slides = useMemo(() => {
    const copy = [...SLIDES_BASE];
    if (!showDemoEntrypoints()) {
      copy[4] = SLIDE_DEMO_ALT;
    }
    return copy;
  }, []);

  const [index, setIndex] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = () => setReduceMotion(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    const ms = reduceMotion ? 9000 : WORKFLOW_SLIDE_INTERVAL_MS;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, ms);
    return () => window.clearInterval(id);
  }, [reduceMotion, slides.length]);

  const outer = [
    "relative flex h-full min-h-[280px] flex-col overflow-hidden rounded-2xl border border-slate-700 bg-gradient-to-br from-[#1E293B] to-[#0F172A] shadow-2xl shadow-black/40",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={outer}>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.12),transparent_55%)]" />
      <div className="relative flex flex-1 flex-col px-5 py-8 sm:px-8 sm:py-10">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-400">The workflow</p>
          <p className="text-[11px] font-medium text-slate-500">Slides auto-advance — tap a dot to jump</p>
        </div>

        {/* Auto-advance progress (hidden when reduced motion — interval still runs for screen readers via slide change) */}
        {!reduceMotion ? (
          <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-slate-700/80">
            <motion.div
              key={index}
              className="h-full rounded-full bg-emerald-400"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: WORKFLOW_SLIDE_INTERVAL_MS / 1000, ease: "linear" }}
            />
          </div>
        ) : null}

        <div className="relative mt-6 min-h-[120px] sm:min-h-[108px] md:min-h-[100px]">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-x-0 top-0"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-500/90">
                Slide {index + 1} of {slides.length}
              </p>
              <p className="mt-3 text-pretty text-lg font-semibold leading-snug tracking-tight text-white sm:text-xl md:text-2xl">
                {slides[index]}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="mt-auto flex flex-wrap items-center justify-center gap-2 pt-8 sm:justify-start">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Slide ${i + 1}`}
              onClick={() => setIndex(i)}
              className={`h-2.5 rounded-full transition-all ${
                i === index ? "w-8 bg-emerald-400" : "w-2.5 bg-slate-600 hover:bg-slate-500"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
