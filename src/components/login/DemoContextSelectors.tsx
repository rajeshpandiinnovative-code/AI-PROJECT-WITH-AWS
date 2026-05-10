"use client";

import { useMemo, useState } from "react";

import { BILLING_BOARD_PRESETS } from "@/src/lib/board-billing";
import { INDIAN_STATES, cityOptionsFor, getDistrictsForState } from "@/src/lib/india-demo-locations";
import { PLATFORM_ROLE_LABELS, PLATFORM_ROLES, type PlatformRole } from "@/src/lib/platform-roles";

const DEFAULT_REGION_STATE = "Tamil Nadu";

export function DemoContextSelectors() {
  const [board, setBoard] = useState<string>(BILLING_BOARD_PRESETS[0]?.key ?? "MATRIC");
  const [boardCustom, setBoardCustom] = useState("");
  const [role, setRole] = useState<PlatformRole>("student");
  const [state, setState] = useState<string>(DEFAULT_REGION_STATE);
  const [district, setDistrict] = useState<string>(() => getDistrictsForState(DEFAULT_REGION_STATE)[0] ?? "Other");
  const [city, setCity] = useState<string>(() => {
    const d0 = getDistrictsForState(DEFAULT_REGION_STATE)[0] ?? "Other";
    return cityOptionsFor(DEFAULT_REGION_STATE, d0)[0] ?? "Other";
  });
  const [saved, setSaved] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const districts = useMemo(() => getDistrictsForState(state), [state]);

  const cities = useMemo(() => cityOptionsFor(state, district), [state, district]);

  const resolvedBoard = board === "__custom__" ? boardCustom.trim() || "MATRIC" : board;

  const persist = async () => {
    setBusy(true);
    setSaved(null);
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
        }),
      });
      if (!res.ok) {
        setSaved("Could not save. Try again.");
        setBusy(false);
        return;
      }
      setSaved("Saved — applied to your next dashboard visit.");
    } catch {
      setSaved("Network error.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mt-10 border-t border-slate-800 pt-8">
      <h2 className="text-sm font-semibold text-slate-200">Demo context (board, role, location)</h2>
      <p className="mt-1 text-xs text-slate-500">
        Optional. Saved on this device for dashboard charts (especially email accounts without a linked school).
      </p>

      <div className="mt-4 space-y-3">
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
            {PLATFORM_ROLES.map((r) => (
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

        <button
          type="button"
          onClick={() => void persist()}
          disabled={busy}
          className="w-full rounded-lg border border-cyan-600/60 bg-cyan-950/40 py-2.5 text-sm font-semibold text-cyan-200 hover:bg-cyan-950/60 disabled:opacity-60"
        >
          {busy ? "Saving…" : "Save demo context"}
        </button>
        {saved ? <p className="text-xs text-emerald-400">{saved}</p> : null}
      </div>
    </section>
  );
}
