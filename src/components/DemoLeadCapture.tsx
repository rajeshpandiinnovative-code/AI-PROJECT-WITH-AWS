"use client";

import { useState } from "react";

export function DemoLeadCapture() {
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
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
    } catch {
      setMessage("Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-10 max-w-xl rounded-2xl border border-cyan-500/30 bg-slate-950/80 p-5 ring-1 ring-cyan-500/20">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">Book a demo</p>
      <h2 className="mt-2 text-lg font-semibold text-white">Leave your name and mobile</h2>
      <p className="mt-1 text-sm text-slate-400">
        We use this for India-wide launch onboarding and board-wise rollouts.
      </p>
      <form onSubmit={(e) => void submit(e)} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label htmlFor="demo-name" className="sr-only">
            Name
          </label>
          <input
            id="demo-name"
            type="text"
            required
            autoComplete="name"
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
          />
        </div>
        <div className="flex-1">
          <label htmlFor="demo-mobile" className="sr-only">
            Mobile
          </label>
          <input
            id="demo-mobile"
            type="tel"
            required
            inputMode="tel"
            autoComplete="tel"
            placeholder="Mobile number"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-slate-950 disabled:opacity-60 sm:shrink-0"
        >
          {busy ? "Sending…" : "Request demo"}
        </button>
      </form>
      {message ? <p className="mt-3 text-sm text-emerald-400">{message}</p> : null}
    </div>
  );
}
