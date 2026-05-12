"use client";

import { useEffect, useState } from "react";
import Lottie from "lottie-react";

import successAnimation from "@/src/assets/lottie/success-check.json";

const DISMISS_MS = 2800;

type GradeSaveSuccessOverlayProps = {
  /** Increment when a grade row is persisted (INSERT or meaningful save). */
  signal: number;
};

export function GradeSaveSuccessOverlay({ signal }: GradeSaveSuccessOverlayProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (signal <= 0) {
      return;
    }
    setVisible(true);
    const t = window.setTimeout(() => setVisible(false), DISMISS_MS);
    return () => window.clearTimeout(t);
  }, [signal]);

  if (!visible) {
    return null;
  }

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[90] flex items-center justify-center bg-emerald-950/20 backdrop-blur-[2px]"
      role="status"
      aria-live="polite"
    >
      <div className="pointer-events-none flex flex-col items-center rounded-2xl border border-emerald-500/40 bg-slate-950/90 px-8 py-6 shadow-2xl shadow-emerald-900/30">
        <Lottie
          key={signal}
          animationData={successAnimation}
          loop={false}
          className="h-36 w-36 sm:h-44 sm:w-44"
        />
        <p className="mt-2 text-center text-sm font-semibold text-emerald-100">Grade saved</p>
      </div>
    </div>
  );
}
