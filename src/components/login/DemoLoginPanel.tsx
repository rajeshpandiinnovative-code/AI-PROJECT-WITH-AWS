"use client";

import { useMemo, useState } from "react";

import { BILLING_BOARD_PRESETS } from "@/src/lib/board-billing";
import { INDIAN_STATES, cityOptionsFor, getDistrictsForState } from "@/src/lib/india-demo-locations";
import {
  DEMO_SELECTABLE_PLATFORM_ROLES,
  PLATFORM_ROLE_LABELS,
  type PlatformRole,
} from "@/src/lib/platform-roles";

const DEFAULT_REGION_STATE = "Tamil Nadu";

export function DemoLoginPanel() {
  const [displayName, setDisplayName] = useState("");
  const [mobile, setMobile] = useState("");
  const [board, setBoard] = useState<string>(BILLING_BOARD_PRESETS[0]?.key ?? "MATRIC");
  const [boardCustom, setBoardCustom] = useState("");
  const [role, setRole] = useState<PlatformRole>("student");
  const [state, setState] = useState<string>(DEFAULT_REGION_STATE);
  const [district, setDistrict] = useState<string>(() => getDistrictsForState(DEFAULT_REGION_STATE)[0] ?? "Other");
  const [city, setCity] = useState<string>(() => {
    const d0 = getDistrictsForState(DEFAULT_REGION_STATE)[0] ?? "Other";
    return cityOptionsFor(DEFAULT_REGION_STATE, d0)[0] ?? "Other";
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const districts = useMemo(() => getDistrictsForState(state), [state]);
  const cities = useMemo(() => cityOptionsFor(state, district), [state, district]);
  const resolvedBoard = board === "__custom__" ? boardCustom.trim() || "MATRIC" : board;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const name = displayName.trim();
    const phone = mobile.trim().replace(/\s+/g, "");
    if (!name) {
      setError("Enter your name.");
      return;
    }
    if (!phone || phone.length < 10) {
      setError("Enter a valid mobile number (at least 10 digits).");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/demo-context", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          board: resolvedBoard,
          role,
          state,
          district,
          city,
          displayName: name,
          mobile: phone,
        }),
      });
      if (!res.ok) {
        setError("Could not start demo. Try again.");
        setBusy(false);
        return;
      }
      window.location.assign("/modules");
    } catch {
      setError("Network error.");
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">Demo entry</p>
        <h1 className="mt-2 text-2xl font-bold text-white">Try the learning modules</h1>
        <p className="mt-2 text-sm text-slate-400">
          No account needed. We create a <span className="text-cyan-300">1-day tracked demo session</span> (saved in our
          database with your role and region), log module activity for operations, and grant full module access for that
          window—including when paid mode is enabled for production pilots.
        </p>
      </div>

      <form onSubmit={(e) => void submit(e)} className="space-y-4">
        <div>
          <label htmlFor="demo-name" className="block text-xs text-slate-500">
            User name
          </label>
          <input
            id="demo-name"
            type="text"
            autoComplete="name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            placeholder="Your display name"
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
          />
        </div>
        <div>
          <label htmlFor="demo-mobile" className="block text-xs text-slate-500">
            Mobile number
          </label>
          <input
            id="demo-mobile"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            required
            placeholder="10-digit mobile"
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <label htmlFor="demo-board" className="block text-xs text-slate-500">
            Board
          </label>
          <select
            id="demo-board"
            value={board}
            onChange={(e) => setBoard(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
          >
            {BILLING_BOARD_PRESETS.map((b) => (
              <option key={b.key} value={b.key}>
                {b.label}
              </option>
            ))}
            <option value="__custom__">Other board</option>
          </select>
          {board === "__custom__" ? (
            <input
              type="text"
              placeholder="Board name"
              value={boardCustom}
              onChange={(e) => setBoardCustom(e.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
            />
          ) : null}
        </div>

        <div>
          <label htmlFor="demo-role" className="block text-xs text-slate-500">
            Role
          </label>
          <select
            id="demo-role"
            value={role}
            onChange={(e) => setRole(e.target.value as PlatformRole)}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
          >
            {DEMO_SELECTABLE_PLATFORM_ROLES.map((r) => (
              <option key={r} value={r}>
                {PLATFORM_ROLE_LABELS[r]}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label htmlFor="demo-state" className="block text-xs text-slate-500">
              State
            </label>
            <select
              id="demo-state"
              value={state}
              onChange={(e) => {
                const s = e.target.value;
                setState(s);
                const firstD = getDistrictsForState(s)[0] ?? "Other";
                setDistrict(firstD);
                const firstC = cityOptionsFor(s, firstD)[0] ?? "Other";
                setCity(firstC);
              }}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
            >
              {INDIAN_STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="demo-district" className="block text-xs text-slate-500">
              District
            </label>
            <select
              id="demo-district"
              value={district}
              onChange={(e) => {
                const d = e.target.value;
                setDistrict(d);
                const opts = cityOptionsFor(state, d);
                setCity(opts[0] ?? "Other");
              }}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
            >
              {districts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="demo-city" className="block text-xs text-slate-500">
              City / town
            </label>
            <select
              id="demo-city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
            >
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error ? <p className="text-sm text-rose-400">{error}</p> : null}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-cyan-500 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-60"
        >
          {busy ? "Starting demo…" : "Continue to modules"}
        </button>
      </form>
    </div>
  );
}
