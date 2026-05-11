"use client";

import { useState } from "react";

export type CheckoutScope =
  | "school"
  | "student"
  | "parent"
  | "TEACHER"
  | "SCHOOL_ADMIN"
  | "MANAGEMENT"
  | "PRINCIPAL";

type Props = {
  scope?: CheckoutScope;
  label?: string;
  /** Curriculum board for role-based checkout (ignored by API for school scope; still used for UI consistency). */
  board?: string;
  /** Omit default top margin (e.g. inline in a table row). */
  compact?: boolean;
  showHint?: boolean;
};

export function CheckoutButton({ scope = "school", label, board, compact, showHint = true }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = async () => {
    setBusy(true);
    setError(null);
    try {
      if (scope !== "school") {
        const b = board?.trim();
        if (!b) {
          throw new Error("Select a curriculum board first (pricing page).");
        }
      }
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scope,
          ...(scope !== "school" && board?.trim() ? { board: board.trim() } : {}),
        }),
      });
      const payload = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !payload.url) {
        throw new Error(payload.error ?? "Checkout unavailable");
      }
      window.location.href = payload.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start checkout");
      setBusy(false);
    }
  };

  const hint =
    scope === "school"
      ? "Sign in with your School ID first. Price follows your school’s board from onboarding."
      : "Register or sign in with email first. Price follows board + role.";

  return (
    <div className={compact ? undefined : "mt-4"}>
      <button
        type="button"
        onClick={() => void start()}
        disabled={busy}
        className="rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-slate-950 disabled:opacity-60"
      >
        {busy ? "Redirecting…" : label ?? "Subscribe with Stripe"}
      </button>
      {error ? <p className="mt-2 text-sm text-rose-400">{error}</p> : null}
      {showHint ? <p className="mt-2 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}
