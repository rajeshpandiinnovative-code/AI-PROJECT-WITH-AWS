"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { BILLING_BOARD_PRESETS } from "@/src/lib/board-billing";
import { PLATFORM_ROLE_LABELS, PLATFORM_ROLES, type PlatformRole } from "@/src/lib/platform-roles";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<PlatformRole>("student");
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
        email: email.trim(),
        password,
        displayName: displayName.trim(),
        role,
      };
      const sid = schoolId.trim();
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

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-12 text-slate-100">
      <div className="mx-auto max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8">
        <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">AI Academy Pro</p>
        <h1 className="mt-3 text-2xl font-bold text-white">Create account</h1>
        <p className="mt-3 text-sm text-slate-400">
          Choose your role and curriculum board for billing (prices are per board + role). You get a trial window; then subscribe on
          the pricing page.
        </p>

        <form onSubmit={(e) => void submit(e)} className="mt-8 space-y-4">
          <div>
            <label htmlFor="displayName" className="block text-xs text-slate-500">
              Display name
            </label>
            <input
              id="displayName"
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-xs text-slate-500">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-xs text-slate-500">
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
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label htmlFor="board" className="block text-xs text-slate-500">
              Curriculum board
            </label>
            <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-center">
              <select
                id="board"
                value={boardSelect}
                onChange={(e) => setBoardSelect(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
              >
                {BILLING_BOARD_PRESETS.map((b) => (
                  <option key={b.key} value={b.key}>
                    {b.label}
                  </option>
                ))}
                <option value="__custom__">Other (type below)</option>
              </select>
              {boardSelect === "__custom__" ? (
                <input
                  type="text"
                  placeholder="Board name"
                  value={customBoard}
                  onChange={(e) => setCustomBoard(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
                />
              ) : null}
            </div>
          </div>
          <div>
            <label htmlFor="role" className="block text-xs text-slate-500">
              Role
            </label>
            <select
              id="role"
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
          <div>
            <label htmlFor="schoolId" className="block text-xs text-slate-500">
              Link to school (optional)
            </label>
            <input
              id="schoolId"
              type="text"
              placeholder="School UUID if you have one"
              value={schoolId}
              onChange={(e) => setSchoolId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-sm text-white outline-none focus:border-emerald-500"
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-emerald-500 py-2.5 text-sm font-semibold text-slate-950 disabled:opacity-60"
          >
            {busy ? "Creating…" : "Create account"}
          </button>
        </form>

        {error ? <p className="mt-4 text-sm text-rose-400">{error}</p> : null}

        <div className="mt-8 flex flex-wrap gap-4 text-sm">
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
