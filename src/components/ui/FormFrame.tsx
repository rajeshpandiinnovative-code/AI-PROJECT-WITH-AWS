import type { ReactNode } from "react";

type FormFrameProps = {
  title: string;
  description?: string;
  eyebrow?: string;
  children: ReactNode;
  className?: string;
};

/**
 * Consistent bordered section for nationwide flows (claim school, register, leads).
 */
export function FormFrame({ title, description, eyebrow, children, className = "" }: FormFrameProps) {
  return (
    <section
      className={`rounded-2xl border border-slate-700 bg-[#1E293B]/90 p-6 shadow-lg shadow-black/20 backdrop-blur-sm ${className}`}
    >
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-400">{eyebrow}</p>
      ) : null}
      <h2 className={`font-semibold text-white ${eyebrow ? "mt-2" : ""} text-xl tracking-tight`}>{title}</h2>
      {description ? <p className="mt-2 text-sm leading-relaxed text-slate-400">{description}</p> : null}
      <div className={description || eyebrow ? "mt-6" : ""}>{children}</div>
    </section>
  );
}
