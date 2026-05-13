"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronLeft, X, MapPin } from "lucide-react";

const TOUR_STEPS = [
  {
    pillarId: "pillar-a",
    title: "Academic & Competitive Excellence",
    description:
      "8 modules covering Vedic Maths, Speed Tricks, NEET/JEE MCQs, and more. Build exam confidence at scale with daily drills and rank predictions.",
    tip: "Start with Vedic Maths for immediate speed improvement.",
  },
  {
    pillarId: "pillar-b",
    title: "The Viral AI Engine",
    description:
      "5 AI-powered modules including Study Planner, Homework Helper, and Quiz Generator. The smart layer that drives retention and referrals.",
    tip: "The AI Study Planner adapts to your class, goal, and weak subjects.",
  },
  {
    pillarId: "pillar-c",
    title: "Skill & Future Readiness",
    description:
      "4 modules for Public Speaking, Coding, Robotics, and Financial Literacy. Skills beyond marks that prepare students for the real world.",
    tip: "Coding for Kids uses pseudo-code — no programming experience needed.",
  },
  {
    pillarId: "pillar-d",
    title: "Wellness & Productivity",
    description:
      "4 modules for Focus, Stress Management, Habit Tracking, and Screen Time. Sustainable performance through healthy routines.",
    tip: "The 4-7-8 breathing technique in Exam Stress Management works instantly.",
  },
];

const TOUR_KEY = "ghost-mode-tour-seen";

export function GuidedTour() {
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    try {
      const seen = localStorage.getItem(TOUR_KEY);
      if (!seen) {
        const timer = setTimeout(() => setActive(true), 3000);
        return () => clearTimeout(timer);
      }
    } catch {}
  }, []);

  const finish = useCallback(() => {
    setActive(false);
    try {
      localStorage.setItem(TOUR_KEY, "1");
    } catch {}
  }, []);

  const next = () => {
    if (step < TOUR_STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      finish();
    }
  };

  const prev = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  const startTour = () => {
    setStep(0);
    setActive(true);
  };

  const current = TOUR_STEPS[step];

  return (
    <>
      {/* Tour Trigger Button */}
      {!active && (
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 2 }}
          onClick={startTour}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full border border-cyan-500/30 bg-slate-900/95 px-4 py-2.5 text-xs font-semibold text-cyan-300 shadow-xl shadow-cyan-500/10 backdrop-blur-xl transition hover:border-cyan-400/50 hover:bg-slate-800/95"
        >
          <MapPin className="h-3.5 w-3.5" />
          Guided Tour
        </motion.button>
      )}

      {/* Tour Overlay */}
      <AnimatePresence>
        {active && current && (
          <motion.div
            key="tour-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-[2px] sm:items-center"
          >
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 30, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="relative m-4 w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-slate-900/95 shadow-2xl backdrop-blur-xl"
            >
              {/* Progress */}
              <div className="flex gap-1 p-4 pb-0">
                {TOUR_STEPS.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      i <= step ? "bg-cyan-400" : "bg-slate-700"
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={finish}
                className="absolute right-3 top-3 rounded-lg p-1.5 text-slate-500 transition hover:bg-white/5 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="p-6 pt-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-400/60">
                  Step {step + 1} of {TOUR_STEPS.length}
                </p>
                <h3 className="mt-2 text-lg font-bold text-white">{current.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">
                  {current.description}
                </p>

                <div className="mt-4 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
                    Pro Tip
                  </p>
                  <p className="mt-1 text-xs text-emerald-200">{current.tip}</p>
                </div>

                <div className="mt-5 flex items-center justify-between">
                  <button
                    onClick={prev}
                    disabled={step === 0}
                    className="flex items-center gap-1 text-xs font-medium text-slate-400 transition hover:text-white disabled:opacity-30"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    Previous
                  </button>
                  <button
                    onClick={next}
                    className="flex items-center gap-1 rounded-lg bg-cyan-500 px-4 py-2 text-xs font-semibold text-slate-950 transition hover:bg-cyan-400"
                  >
                    {step === TOUR_STEPS.length - 1 ? "Finish Tour" : "Next Pillar"}
                    {step < TOUR_STEPS.length - 1 && <ChevronRight className="h-3.5 w-3.5" />}
                  </button>
                </div>

                <p className="mt-4 text-center text-[9px] text-slate-600">
                  Powered by Pinnacle Software Solution
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
