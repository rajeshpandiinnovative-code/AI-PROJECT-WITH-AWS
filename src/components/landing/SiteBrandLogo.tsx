import { BookOpen, GraduationCap } from "lucide-react";

/** AI Coaching Centre wordmark (icon + text); `scale-x-[1.03]` widens the mark ~3% from the left. */
export function SiteBrandLogo() {
  return (
    <span className="inline-flex shrink-0 origin-left scale-x-[1.03] transform-gpu items-center gap-2.5">
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-900/90 ring-1 ring-slate-700/90 sm:h-8 sm:w-8"
        aria-hidden
      >
        <span className="relative inline-flex">
          <BookOpen className="size-[1.05rem] text-white sm:size-4" strokeWidth={2} />
          <GraduationCap
            className="absolute -right-1 -top-1 size-3.5 text-sky-400 drop-shadow-sm"
            strokeWidth={2}
          />
        </span>
      </span>
      <span className="flex flex-col text-left hyphens-none">
        <span className="text-xs font-bold leading-tight tracking-normal text-white sm:text-[13px] sm:leading-snug">
          <span className="text-sky-400">AI</span>
          {/* Narrow no-break between “AI” and “Coaching” so the brand isn’t split awkwardly */}
          <span className="text-white">{"\u00A0"}</span>
          <span className="text-white">Coaching Centre</span>
        </span>
        <span className="mt-0.5 text-[10px] font-normal leading-snug tracking-normal text-slate-400 sm:text-[11px]">
          Smart Learning. Better Future.
        </span>
      </span>
    </span>
  );
}
