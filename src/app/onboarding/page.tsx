"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Building2, CheckCircle2, Loader2 } from "lucide-react";

import { FormFrame } from "@/src/components/ui/FormFrame";
import { PilotNav } from "@/src/components/PilotNav";
import { DIRECTORY_SELECT_CLASS } from "@/src/lib/directory-ui";

type SchoolRow = {
  udiseCode: string;
  schoolName: string;
  districtName: string | null;
  blockName: string | null;
  boardName: string | null;
  pincode: string | null;
};

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Request failed");
  return (await res.json()) as T;
}

export default function OnboardingPage() {
  const [states, setStates] = useState<string[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [blocks, setBlocks] = useState<string[]>([]);
  const [boards, setBoards] = useState<string[]>([]);

  const [state, setState] = useState("");
  const [district, setDistrict] = useState("");
  const [block, setBlock] = useState("");
  const [board, setBoard] = useState("");

  const [refine, setRefine] = useState("");
  const [schoolOptions, setSchoolOptions] = useState<SchoolRow[]>([]);
  const [selectedUdise, setSelectedUdise] = useState("");
  const [loadingSchools, setLoadingSchools] = useState(false);
  const [facetsBusy, setFacetsBusy] = useState(false);

  const [claiming, setClaiming] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);

  const selectedSchool = schoolOptions.find((s) => s.udiseCode === selectedUdise) ?? null;

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const data = await fetchJson<{ values: string[] }>("/api/directory/facets?kind=states");
        if (!cancelled) setStates(data.values ?? []);
      } catch {
        if (!cancelled) setStates([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function onStateChange(next: string) {
    setState(next);
    setDistrict("");
    setBlock("");
    setBoard("");
    setSchoolOptions([]);
    setSelectedUdise("");
    if (!next) {
      setDistricts([]);
      setBlocks([]);
      setBoards([]);
    }
  }

  function onDistrictChange(next: string) {
    setDistrict(next);
    setBlock("");
    setBoard("");
    setSchoolOptions([]);
    setSelectedUdise("");
    if (!next) {
      setBlocks([]);
      setBoards([]);
    }
  }

  function onBlockChange(next: string) {
    setBlock(next);
    setBoard("");
    setSchoolOptions([]);
    setSelectedUdise("");
  }

  function onBoardChange(next: string) {
    setBoard(next);
    setSchoolOptions([]);
    setSelectedUdise("");
  }

  useEffect(() => {
    if (!state) return;
    let cancelled = false;
    void (async () => {
      setFacetsBusy(true);
      try {
        const d = await fetchJson<{ values: string[] }>(
          `/api/directory/facets?kind=districts&state=${encodeURIComponent(state)}`,
        );
        if (!cancelled) setDistricts(d.values ?? []);
      } catch {
        if (!cancelled) setDistricts([]);
      } finally {
        if (!cancelled) setFacetsBusy(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [state]);

  useEffect(() => {
    if (!state || !district) return;
    let cancelled = false;
    void (async () => {
      setFacetsBusy(true);
      try {
        const u = `/api/directory/facets?kind=blocks&state=${encodeURIComponent(state)}&district=${encodeURIComponent(district)}`;
        const b = await fetchJson<{ values: string[] }>(u);
        if (!cancelled) setBlocks(b.values ?? []);
      } catch {
        if (!cancelled) setBlocks([]);
      } finally {
        if (!cancelled) setFacetsBusy(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [state, district]);

  useEffect(() => {
    if (!state) return;
    let cancelled = false;
    void (async () => {
      try {
        const qs = new URLSearchParams({ kind: "boards", state });
        if (district) qs.set("district", district);
        if (block) qs.set("block", block);
        const data = await fetchJson<{ values: string[] }>(`/api/directory/facets?${qs.toString()}`);
        if (!cancelled) setBoards(data.values ?? []);
      } catch {
        if (!cancelled) setBoards([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [state, district, block]);

  const loadSchools = useCallback(async () => {
    if (!state) {
      setSchoolOptions([]);
      setSelectedUdise("");
      setLoadingSchools(false);
      return;
    }
    setLoadingSchools(true);
    try {
      const qs = new URLSearchParams({ state, limit: "250" });
      if (district) qs.set("district", district);
      if (block) qs.set("block", block);
      if (board) qs.set("board", board);
      const r = refine.trim();
      if (r.length >= 2) qs.set("q", r);
      const data = await fetchJson<{ schools: SchoolRow[] }>(`/api/directory/schools?${qs.toString()}`);
      const list = data.schools ?? [];
      setSchoolOptions(list);
      setSelectedUdise((prev) => (list.some((x) => x.udiseCode === prev) ? prev : ""));
    } catch {
      setSchoolOptions([]);
      setSelectedUdise("");
    } finally {
      setLoadingSchools(false);
    }
  }, [state, district, block, board, refine]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      void loadSchools();
    }, state ? 320 : 0);
    return () => window.clearTimeout(t);
  }, [state, district, block, board, refine, loadSchools]);

  function persistSelection(s: SchoolRow) {
    setClaimError(null);
    try {
      sessionStorage.setItem(
        "oasis_claimed_school",
        JSON.stringify({ udiseCode: s.udiseCode, schoolName: s.schoolName }),
      );
    } catch {
      /* ignore */
    }
  }

  async function claimAndContinue() {
    if (!selectedSchool) return;
    setClaiming(true);
    setClaimError(null);
    try {
      const res = await fetch("/api/claim-school", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ udiseCode: selectedSchool.udiseCode }),
      });
      const data = (await res.json()) as {
        error?: string;
        schoolId?: string;
      };
      if (!res.ok) {
        throw new Error(data.error ?? "Could not claim school.");
      }
      if (!data.schoolId) {
        throw new Error("Missing school tenant id.");
      }

      const signInResult = await signIn("credentials", {
        schoolId: data.schoolId,
        redirect: false,
      });

      if (signInResult?.error) {
        throw new Error(signInResult.error);
      }

      window.location.assign("/scanner");
    } catch (e) {
      setClaimError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setClaiming(false);
    }
  }

  const tooMany =
    state && schoolOptions.length >= 250 && refine.trim().length < 2 && !district && !block;

  return (
    <div className="min-h-screen bg-[#0F172A] text-zinc-100">
      <header className="border-b border-slate-700/80 bg-[#1E293B]/80 backdrop-blur">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-white"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Home
          </Link>
          <PilotNav />
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-8 px-4 py-8 sm:py-12">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">India-wide launch</p>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Claim your school</h1>
          <p className="max-w-xl text-base text-slate-400">
            Use the framed steps below: pick location from the national UDISE directory, then choose your school from
            the list. Refine with extra keywords only if the list is long.
          </p>
        </div>

        <FormFrame
          eyebrow="Step 1"
          title="Location filters"
          description="Select State / UT first. Narrow by district, block, or board when your area has many schools."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-slate-300">
              State / UT
              <select
                required
                value={state}
                disabled={facetsBusy && !states.length}
                onChange={(e) => onStateChange(e.target.value)}
                className={`mt-2 ${DIRECTORY_SELECT_CLASS}`}
              >
                <option value="">Choose state / UT…</option>
                {states.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium text-slate-300">
              District
              <select
                value={district}
                disabled={!state}
                onChange={(e) => onDistrictChange(e.target.value)}
                className={`mt-2 ${DIRECTORY_SELECT_CLASS}`}
              >
                <option value="">All districts in state (or pick one)</option>
                {districts.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium text-slate-300">
              Block (optional)
              <select
                value={block}
                disabled={!state || !district}
                onChange={(e) => onBlockChange(e.target.value)}
                className={`mt-2 ${DIRECTORY_SELECT_CLASS}`}
              >
                <option value="">Any block</option>
                {blocks.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium text-slate-300">
              Board filter (optional)
              <select
                value={board}
                disabled={!state}
                onChange={(e) => onBoardChange(e.target.value)}
                className={`mt-2 ${DIRECTORY_SELECT_CLASS}`}
              >
                <option value="">Any board</option>
                {boards.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </FormFrame>

        <FormFrame
          eyebrow="Step 2"
          title="Pick your school"
          description="Schools load from your filters (up to 250). If you still see too many, type part of the school name or UDISE in refine."
        >
          <label className="block text-sm font-medium text-slate-300">
            School
            <select
              value={selectedUdise}
              disabled={!state || loadingSchools}
              onChange={(e) => {
                const code = e.target.value;
                setSelectedUdise(code);
                const row = schoolOptions.find((x) => x.udiseCode === code);
                if (row) persistSelection(row);
              }}
              className={`mt-2 ${DIRECTORY_SELECT_CLASS}`}
            >
              <option value="">
                {!state ? "Choose state first…" : loadingSchools ? "Loading schools…" : "Select your school…"}
              </option>
              {schoolOptions.map((s) => (
                <option key={s.udiseCode} value={s.udiseCode}>
                  {s.schoolName} — UDISE {s.udiseCode}
                </option>
              ))}
            </select>
          </label>

          <label className="mt-4 block text-sm font-medium text-slate-300">
            Refine list (optional — min 2 characters)
            <input
              type="search"
              value={refine}
              onChange={(e) => setRefine(e.target.value)}
              autoComplete="off"
              placeholder="Part of school name or UDISE…"
              disabled={!state}
              className="mt-2 min-h-[48px] w-full rounded-xl border border-slate-600 bg-[#1E293B] px-4 py-3 text-base text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 disabled:opacity-45"
            />
          </label>

          {loadingSchools ? (
            <p className="mt-3 flex items-center gap-2 text-sm text-slate-400">
              <Loader2 className="size-4 animate-spin text-emerald-400" aria-hidden />
              Updating directory…
            </p>
          ) : null}

          {tooMany ? (
            <p className="mt-4 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
              Large state: pick at least <strong>district</strong> or type <strong>refine</strong> keywords so we can
              show a shorter list.
            </p>
          ) : null}

          {state && !loadingSchools && schoolOptions.length === 0 ? (
            <p className="mt-4 rounded-xl border border-dashed border-slate-600 bg-[#0F172A]/60 px-4 py-4 text-sm text-slate-400">
              No rows match these filters yet. Import UDISE CSV data for your region, or adjust filters / refine text.
            </p>
          ) : null}

          {selectedSchool ? (
            <div className="mt-6 flex gap-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4">
              <Building2 className="mt-0.5 size-6 shrink-0 text-emerald-400" aria-hidden />
              <div>
                <p className="font-semibold text-white">{selectedSchool.schoolName}</p>
                <p className="text-sm text-slate-400">
                  {[selectedSchool.blockName, selectedSchool.districtName].filter(Boolean).join(" · ")}
                  {selectedSchool.boardName ? ` · ${selectedSchool.boardName}` : ""}
                </p>
                <p className="font-mono text-xs text-slate-500">UDISE {selectedSchool.udiseCode}</p>
              </div>
              <CheckCircle2 className="ml-auto size-6 shrink-0 text-emerald-400" aria-hidden />
            </div>
          ) : null}
        </FormFrame>

        <FormFrame eyebrow="Step 3" title="Continue" description="Creates your tenant if needed, signs you in, and opens scanning.">
          <button
            type="button"
            onClick={() => void claimAndContinue()}
            disabled={claiming || !selectedSchool}
            className="inline-flex min-h-[52px] w-full min-w-[44px] items-center justify-center gap-2 rounded-xl bg-[#10B981] px-6 text-lg font-semibold text-[#0F172A] shadow-lg shadow-emerald-900/40 transition hover:bg-[#059669] disabled:opacity-60 sm:w-auto"
          >
            {claiming ? (
              <>
                <Loader2 className="size-5 animate-spin" aria-hidden />
                Claiming…
              </>
            ) : (
              "Continue to scanning"
            )}
          </button>
          {claimError ? (
            <p className="mt-3 text-sm text-red-400" role="alert">
              {claimError}
            </p>
          ) : null}
          <p className="mt-4 text-xs text-slate-500">
            Creates your tenant in our database (if new), signs you in, and opens the scan flow with onboarding defaults
            pre-filled.
          </p>
        </FormFrame>
      </main>
    </div>
  );
}
