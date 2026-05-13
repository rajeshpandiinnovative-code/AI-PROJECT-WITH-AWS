"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lightbulb, X, Sparkles } from "lucide-react";

import { getWelcomeNudge, getIdleNudge, getStuckNudge, type NudgeTrigger } from "@/src/lib/BehaviorEngine";
import { Phone } from "lucide-react";

type ProactiveNudgeProps = {
  moduleSlug: string;
  moduleTitle?: string;
  userGrade?: number | string;
  onAction?: () => void;
  examFailed?: boolean;
};

export function ProactiveNudge({ moduleSlug, moduleTitle, userGrade, onAction, examFailed }: ProactiveNudgeProps) {
  const [nudge, setNudge] = useState<NudgeTrigger | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [phase, setPhase] = useState<"welcome" | "idle" | "stuck">("welcome");
  const stuckData = getStuckNudge(moduleSlug);

  useEffect(() => {
    if (examFailed) {
      setPhase("stuck");
      setNudge({
        type: "stuck",
        message: stuckData.message,
        delay: 0,
        actionLabel: stuckData.retryLabel,
      });
      setDismissed(false);
    }
  }, [examFailed, stuckData.message, stuckData.retryLabel]);

  const dismiss = useCallback(() => {
    setDismissed(true);
    setNudge(null);
  }, []);

  useEffect(() => {
    setDismissed(false);
    setPhase("welcome");
    setNudge(null);

    const welcome = getWelcomeNudge(moduleSlug);
    if (!welcome) return;

    const welcomeTimer = window.setTimeout(() => {
      setNudge(welcome);
      setPhase("welcome");
    }, welcome.delay);

    return () => window.clearTimeout(welcomeTimer);
  }, [moduleSlug]);

  useEffect(() => {
    if (phase !== "welcome" || dismissed) return;

    const idleNudge = getIdleNudge(moduleSlug);
    if (!idleNudge) return;

    let idleTimer: number;
    let lastActivity = Date.now();

    const resetIdle = () => {
      lastActivity = Date.now();
    };

    const checkIdle = () => {
      if (Date.now() - lastActivity >= idleNudge.delay) {
        setNudge(idleNudge);
        setPhase("idle");
      }
    };

    window.addEventListener("mousemove", resetIdle);
    window.addEventListener("keydown", resetIdle);
    window.addEventListener("click", resetIdle);
    window.addEventListener("scroll", resetIdle);

    idleTimer = window.setInterval(checkIdle, 1000);

    return () => {
      window.removeEventListener("mousemove", resetIdle);
      window.removeEventListener("keydown", resetIdle);
      window.removeEventListener("click", resetIdle);
      window.removeEventListener("scroll", resetIdle);
      window.clearInterval(idleTimer);
    };
  }, [moduleSlug, phase, dismissed]);

  return (
    <AnimatePresence>
      {nudge && !dismissed && (
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className={`relative overflow-hidden rounded-xl border p-4 shadow-lg backdrop-blur-xl ${
            phase === "stuck"
              ? "border-amber-500/30 bg-gradient-to-r from-amber-950/60 via-slate-900/90 to-slate-900/80 shadow-amber-500/5"
              : "border-cyan-500/30 bg-gradient-to-r from-cyan-950/80 via-slate-900/90 to-slate-900/80 shadow-cyan-500/5"
          }`}
        >
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-cyan-400/[0.03] to-transparent" />

          <button
            onClick={dismiss}
            className="absolute right-2 top-2 rounded-md p-1 text-slate-500 transition hover:bg-white/5 hover:text-slate-300"
          >
            <X className="h-3.5 w-3.5" />
          </button>

          <div className="flex items-start gap-3">
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
              phase === "stuck" ? "bg-amber-500/15" : "bg-cyan-500/10"
            }`}>
              {phase === "stuck" ? (
                <Phone className="h-4 w-4 text-amber-400" />
              ) : phase === "idle" ? (
                <Sparkles className="h-4 w-4 text-amber-400" />
              ) : (
                <Lightbulb className="h-4 w-4 text-cyan-400" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className={`text-[10px] font-semibold uppercase tracking-[0.15em] ${
                phase === "stuck" ? "text-amber-400/80" : "text-cyan-400/70"
              }`}>
                {phase === "stuck" ? "Need Help?" : phase === "idle" ? "AI Suggestion" : "Welcome Tip"}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-slate-200">
                {nudge.message}
              </p>
              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                {phase === "stuck" && (
                  <a
                    href={`https://wa.me/919535761292?text=${encodeURIComponent(
                      `Hi Pinnacle, I need help with ${moduleTitle ?? moduleSlug} for Standard ${userGrade ?? "N/A"}.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-lg bg-emerald-500/20 px-3 py-1 text-[11px] font-semibold text-emerald-300 transition hover:bg-emerald-500/30"
                  >
                    <Phone className="h-3 w-3" />
                    Consult Pinnacle Expert via WhatsApp
                  </a>
                )}
                {nudge.actionLabel && (
                  <button
                    onClick={() => {
                      onAction?.();
                      dismiss();
                    }}
                    className="rounded-lg bg-cyan-500/20 px-3 py-1 text-[11px] font-semibold text-cyan-300 transition hover:bg-cyan-500/30"
                  >
                    {nudge.actionLabel}
                  </button>
                )}
                <button
                  onClick={dismiss}
                  className="text-[11px] text-slate-500 transition hover:text-slate-400"
                >
                  Dismiss
                </button>
              </div>
              <p className="mt-2 text-[9px] text-slate-600">
                Powered by Pinnacle Software Solution
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
