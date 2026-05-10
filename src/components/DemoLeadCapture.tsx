"use client";

import { useState } from "react";

import { FormFrame } from "@/src/components/ui/FormFrame";
import { INDIAN_STATES } from "@/src/lib/india-demo-locations";

export function DemoLeadCapture() {
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [regionUt, setRegionUt] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/demo-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          mobile: mobile.trim(),
          regionUt: regionUt.trim() || undefined,
          path: typeof window !== "undefined" ? window.location.pathname : "/",
          referrer: typeof document !== "undefined" ? document.referrer || undefined : undefined,
        }),
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        setMessage(body.error ?? "Could not save.");
        setBusy(false);
        return;
      }
      setMessage("Thanks — we will contact you shortly.");
      setName("");
      setMobile("");
      setRegionUt("");
    } catch {
      setMessage("Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <FormFrame
      eyebrow="Book a demo"
      title="Nationwide rollout — leave your details"
      description="Pick your State / UT, then share name and mobile. We route demos by region for India-wide onboarding."
      className="mt-10 max-w-xl border-cyan-500/30 bg-slate-950/80 ring-1 ring-cyan-500/20"
    >
      <form onSubmit={(e) => void submit(e)} className="space-y-4">
        <label className="block text-sm font-medium text-slate-300">
          State / Union Territory
          <select
            required
            value={regionUt}
            onChange={(e) => setRegionUt(e.target.value)}
            className="mt-2 min-h-[48px] w-full rounded-xl border border-slate-600 bg-slate-900 px-4 py-3 text-base text-white focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
          >
            <option value="">Choose…</option>
            {INDIAN_STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-medium text-slate-300">
          Full name
          <input
            type="text"
            required
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-2 min-h-[48px] w-full rounded-xl border border-slate-600 bg-slate-900 px-4 py-3 text-base text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
          />
        </label>

        <label className="block text-sm font-medium text-slate-300">
          Mobile number
          <input
            type="tel"
            required
            inputMode="tel"
            autoComplete="tel"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            className="mt-2 min-h-[48px] w-full rounded-xl border border-slate-600 bg-slate-900 px-4 py-3 text-base text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
          />
        </label>

        <button
          type="submit"
          disabled={busy}
          className="min-h-[48px] w-full rounded-xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 disabled:opacity-60"
        >
          {busy ? "Sending…" : "Request demo"}
        </button>
      </form>
      {message ? <p className="mt-4 text-sm text-emerald-400">{message}</p> : null}
    </FormFrame>
  );
}
