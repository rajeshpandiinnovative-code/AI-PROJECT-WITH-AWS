"use client";

import Lottie from "lottie-react";

import scanningAnimation from "@/src/assets/lottie/scanning.json";

type ProcessingOverlayProps = {
  /** Full-screen dimmed overlay while OCR + Gemini run (typically teachers only). */
  open: boolean;
  /** Optional override; defaults to handwriting analysis copy. */
  message?: string;
};

export function ProcessingOverlay({
  open,
  message = "AI is analyzing student handwriting...",
}: ProcessingOverlayProps) {
  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex flex-col items-center justify-center gap-4 bg-slate-950/75 px-6 backdrop-blur-sm"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="w-[min(280px,72vw)]">
        <Lottie animationData={scanningAnimation} loop className="h-40 w-full sm:h-48" />
      </div>
      <p className="max-w-md text-center text-sm font-medium text-slate-100 sm:text-base">{message}</p>
    </div>
  );
}
