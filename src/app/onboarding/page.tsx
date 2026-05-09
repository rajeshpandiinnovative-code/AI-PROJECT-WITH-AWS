"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Building2, CheckCircle2, Loader2, Search } from "lucide-react";

import { PilotNav } from "@/src/components/PilotNav";

type SchoolRow = {
  udiseCode: string;
  schoolName: string;
  districtName: string | null;
  blockName: string | null;
  boardName: string | null;
  pincode: string | null;
};

export default function OnboardingPage() {
  const [query, setQuery] = useState("");
  const [schools, setSchools] = useState<SchoolRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [selected, setSelected] = useState<SchoolRow | null>(null);

  const fetchSchools = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setSchools([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/directory/schools?q=${encodeURIComponent(q.trim())}`);
      if (!res.ok) throw new Error("Search failed");
      const data = (await res.json()) as { schools: SchoolRow[] };
      setSchools(data.schools ?? []);
    } catch {
      setSchools([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => {
      void fetchSchools(query);
    }, 280);
    return () => window.clearTimeout(t);
  }, [query, fetchSchools]);

  function selectSchool(s: SchoolRow) {
    setClaimError(null);
    setSelected(s);
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
    if (!selected) return;
    setClaiming(true);
    setClaimError(null);
    try {
      const res = await fetch("/api/claim-school", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ udiseCode: selected.udiseCode }),
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

      /** Full navigation so the session cookie is reliably attached before `/scanner` loads. */
      window.location.assign("/scanner");
    } catch (e) {
      setClaimError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setClaiming(false);
    }
  }

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

      <main className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
        <div className="mb-8 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">National rollout</p>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Claim your school
          </h1>
          <p className="max-w-xl text-base text-slate-400">
            Search schools across the national directory by school name, UDISE code, district, or block.
            Select your school and continue to scanning.
          </p>
        </div>

        <label className="mb-2 block text-sm font-medium text-slate-300">Find your school</label>
        <div className="relative mb-6">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-500" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="School name, UDISE, block, or district"
            autoComplete="off"
            className="min-h-[52px] w-full rounded-xl border border-slate-600 bg-[#1E293B] py-3 pl-12 pr-4 text-base text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          />
          {loading && (
            <Loader2 className="absolute right-4 top-1/2 size-5 -translate-y-1/2 animate-spin text-emerald-400" />
          )}
        </div>

        <ul className="space-y-2">
          {schools.map((s) => {
            const active = selected?.udiseCode === s.udiseCode;
            return (
              <li key={s.udiseCode}>
                <button
                  type="button"
                  onClick={() => selectSchool(s)}
                  className={`flex w-full flex-col gap-1 rounded-xl border px-4 py-4 text-left transition sm:flex-row sm:items-center sm:justify-between ${
                    active
                      ? "border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/40"
                      : "border-slate-700 bg-[#1E293B] hover:border-slate-600"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Building2 className="mt-0.5 size-5 shrink-0 text-emerald-400" />
                    <div>
                      <p className="font-semibold text-white">{s.schoolName}</p>
                      <p className="text-sm text-slate-400">
                        {[s.blockName, s.districtName].filter(Boolean).join(" · ")}
                        {s.boardName ? ` · ${s.boardName}` : ""}
                      </p>
                      <p className="font-mono text-xs text-slate-500">UDISE {s.udiseCode}</p>
                    </div>
                  </div>
                  {active && <CheckCircle2 className="size-6 shrink-0 text-emerald-400" aria-hidden />}
                </button>
              </li>
            );
          })}
        </ul>

        {query.trim().length >= 2 && !loading && schools.length === 0 && (
          <p className="mt-6 rounded-xl border border-dashed border-slate-600 bg-[#1E293B]/50 px-4 py-6 text-center text-sm text-slate-400">
            No schools matched. Try another spelling or UDISE code.
          </p>
        )}

        <div className="mt-10 rounded-2xl border border-slate-700 bg-[#1E293B] p-6">
          {selected ? (
            <>
              <p className="text-sm font-medium text-slate-300">Selected</p>
              <p className="mt-1 text-lg font-semibold text-white">{selected.schoolName}</p>
              <p className="mt-2 text-sm text-slate-400">UDISE {selected.udiseCode}</p>
              <button
                type="button"
                onClick={() => void claimAndContinue()}
                disabled={claiming}
                className="mt-6 inline-flex min-h-[52px] w-full min-w-[44px] items-center justify-center gap-2 rounded-xl bg-[#10B981] px-6 text-lg font-semibold text-[#0F172A] shadow-lg shadow-emerald-900/40 transition hover:bg-[#059669] disabled:opacity-60 sm:w-auto"
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
                Creates your tenant in our database (if new), signs you in, and opens the scan flow with
                onboarding defaults pre-filled.
              </p>
            </>
          ) : (
            <p className="text-center text-sm text-slate-400">
              Select a school above to enable “Continue to scanning.” Your choice is stored for this session
              only.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
