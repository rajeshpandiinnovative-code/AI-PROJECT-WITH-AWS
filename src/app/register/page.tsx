"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { FormFrame } from "@/src/components/ui/FormFrame";
import { BILLING_BOARD_PRESETS } from "@/src/lib/board-billing";
import {
  PLATFORM_ROLE_LABELS,
  SELECTABLE_PLATFORM_ROLES,
  type PlatformRole,
} from "@/src/lib/platform-roles";

export default function RegisterPage() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<PlatformRole>("student");
  const [schoolLinkMode, setSchoolLinkMode] = useState<"none" | "id">("none");
  const [schoolId, setSchoolId] = useState("");
  const [boardSelect, setBoardSelect] = useState<string>(BILLING_BOARD_PRESETS[0]?.key ?? "MATRIC");
  const [customBoard, setCustomBoard] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        phoneNumber: phoneNumber.trim(),
        password,
        displayName: displayName.trim(),
        role,
      };
      const sid = schoolLinkMode === "id" ? schoolId.trim() : "";
      if (sid) {
        body.schoolId = sid;
      }
      const board =
        boardSelect === "__custom__" ? customBoard.trim() : boardSelect.trim();
      if (board) {
        body.board = board;
      }
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(payload.error ?? "Registration failed");
        setBusy(false);
        return;
      }
      router.push("/login?registered=1");
    } catch {
      setError("Registration failed.");
      setBusy(false);
    }
  };

  const selectBase =
    "mt-2 min-h-[48px] w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/25";

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-12 text-slate-100">
      <div className="mx-auto max-w-lg space-y-8">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">AI Academy Pro</p>
          <h1 className="mt-3 text-2xl font-bold text-white">Create account</h1>
          <p className="mt-3 text-sm text-slate-400">
            Paid user onboarding: register with mobile + email, then sign in and subscribe from pricing.
          </p>
        </div>

        <FormFrame eyebrow="Account" title="Sign-in credentials" description="Email and password stay typed here for security.">
          <form onSubmit={(e) => void submit(e)} className="space-y-6">
            <div>
              <label htmlFor="displayName" className="block text-xs font-medium text-slate-500">
                Display name
              </label>
              <input
                id="displayName"
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className={`${selectBase} mt-2`}
              />
            </div>
            <div>
              <label htmlFor="phoneNumber" className="block text-xs font-medium text-slate-500">
                Mobile number (10 digits)
              </label>
              <input
                id="phoneNumber"
                type="tel"
                autoComplete="tel"
                required
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className={`${selectBase} mt-2`}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-xs font-medium text-slate-500">
                Password (min 8 characters)
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`${selectBase} mt-2`}
              />
            </div>

            <FormFrame
              eyebrow="Curriculum"
              title="Board & role"
              description="Board drives Stripe prices per board + role."
              className="border-slate-700/80 bg-slate-900/40 p-5"
            >
              <div className="space-y-4">
                <div>
                  <label htmlFor="board" className="block text-xs font-medium text-slate-500">
                    Curriculum board
                  </label>
                  <select
                    id="board"
                    value={boardSelect}
                    onChange={(e) => setBoardSelect(e.target.value)}
                    className={selectBase}
                  >
                    {BILLING_BOARD_PRESETS.map((b) => (
                      <option key={b.key} value={b.key}>
                        {b.label}
                      </option>
                    ))}
                    <option value="__custom__">Other — describe briefly</option>
                  </select>
                  {boardSelect === "__custom__" ? (
                    <input
                      type="text"
                      placeholder="Board name"
                      value={customBoard}
                      onChange={(e) => setCustomBoard(e.target.value)}
                      className={`${selectBase} mt-2`}
                    />
                  ) : null}
                </div>
                <div>
                  <label htmlFor="role" className="block text-xs font-medium text-slate-500">
                    Role
                  </label>
                  <select
                    id="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value as PlatformRole)}
                    className={selectBase}
                  >
                    {SELECTABLE_PLATFORM_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {PLATFORM_ROLE_LABELS[r]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </FormFrame>

            <FormFrame
              eyebrow="School"
              title="Link to school tenant (optional)"
              description="Choose whether you already have a School ID from onboarding."
              className="border-slate-700/80 bg-slate-900/40 p-5"
            >
              <label htmlFor="schoolLinkMode" className="block text-xs font-medium text-slate-500">
                School link
              </label>
              <select
                id="schoolLinkMode"
                value={schoolLinkMode}
                onChange={(e) => setSchoolLinkMode(e.target.value as "none" | "id")}
                className={selectBase}
              >
                <option value="none">No — I will link later</option>
                <option value="id">Yes — I have a School tenant UUID</option>
              </select>
              {schoolLinkMode === "id" ? (
                <label htmlFor="schoolId" className="mt-4 block text-xs font-medium text-slate-500">
                  School tenant UUID
                  <input
                    id="schoolId"
                    type="text"
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    value={schoolId}
                    onChange={(e) => setSchoolId(e.target.value)}
                    className={`${selectBase} mt-2 font-mono text-xs`}
                  />
                </label>
              ) : null}
            </FormFrame>

            <button
              type="submit"
              disabled={busy}
              className="min-h-[52px] w-full rounded-xl bg-emerald-500 py-3 text-sm font-semibold text-slate-950 disabled:opacity-60"
            >
              {busy ? "Creating…" : "Create account"}
            </button>
          </form>
        </FormFrame>

        {error ? <p className="text-sm text-rose-400">{error}</p> : null}

        <div className="flex flex-wrap gap-4 text-sm">
          <Link href="/login" className="text-cyan-400 underline">
            Already have an account
          </Link>
          <Link href="/pricing" className="text-cyan-400 underline">
            Pricing
          </Link>
        </div>
      </div>
    </main>
  );
}
