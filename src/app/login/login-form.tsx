"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { DemoContextSelectors } from "@/src/components/login/DemoContextSelectors";

const UUID_HEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function schoolIdFormatHint(trimmed: string): string | null {
  if (!trimmed) {
    return "Enter your School ID.";
  }
  if (UUID_HEX.test(trimmed)) {
    return null;
  }
  const parts = trimmed.split("-").filter((p) => p.length > 0);
  const looksLikeMissingFirstSegment =
    parts.length === 4 && parts[0].length <= 4 && /^[0-9a-f]{12}$/i.test(parts[3] ?? "");
  if (looksLikeMissingFirstSegment) {
    return "That value is missing the first block of the UUID (eight hex characters before the first hyphen). Paste the complete School ID—for example it must look like xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx, not starting with a short group such as 0000-.";
  }
  return "School ID must be a full UUID in the form xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx (36 characters including hyphens).";
}

type Props = {
  registered?: boolean;
};

export function LoginForm({ registered }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [schoolId, setSchoolId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await signIn("credentials", {
        email: email.trim(),
        password,
        redirect: false,
      });
      if (res?.error) {
        setError("Email or password was not recognized.");
        void fetch("/api/analytics/event", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventType: "login_failed",
            payload: { method: "email", email: email.trim().toLowerCase() },
          }),
        }).catch(() => {});
        setBusy(false);
        return;
      }
      setBusy(false);
      window.location.assign("/dashboard");
    } catch {
      setError("Sign-in failed.");
      setBusy(false);
    }
  };

  const submitSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const trimmed = schoolId.trim();
    const formatErr = schoolIdFormatHint(trimmed);
    if (formatErr) {
      setError(formatErr);
      setBusy(false);
      return;
    }
    try {
      const res = await signIn("credentials", {
        schoolId: trimmed,
        redirect: false,
      });
      if (res?.error) {
        setError(
          "No school tenant matches this School ID. Claim your school on onboarding, confirm the UUID from your admin, or use the full seeded QA id from README.",
        );
        void fetch("/api/analytics/event", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventType: "login_failed",
            payload: { method: "school_id", schoolId: trimmed },
          }),
        }).catch(() => {});
        setBusy(false);
        return;
      }
      setBusy(false);
      window.location.assign("/dashboard");
    } catch {
      setError("Sign-in failed.");
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-12 text-slate-100">
      <div className="mx-auto max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8">
        <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">AI Academy Pro</p>
        <h1 className="mt-3 text-2xl font-bold text-white">Sign in</h1>
        {registered ? (
          <p className="mt-3 text-sm text-emerald-400">Account created—sign in with your email and password.</p>
        ) : (
          <p className="mt-3 text-sm text-slate-400">
            Use an email account for individual role billing, or your School ID for tenant-wide access.
          </p>
        )}

        <section className="mt-8">
          <h2 className="text-sm font-semibold text-slate-200">Email &amp; password</h2>
          <form onSubmit={(e) => void submitEmail(e)} className="mt-3 space-y-3">
            <div>
              <label htmlFor="email" className="block text-xs text-slate-500">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-xs text-slate-500">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
              />
            </div>
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-lg bg-emerald-500 py-2.5 text-sm font-semibold text-slate-950 disabled:opacity-60"
            >
              {busy ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </section>

        <section className="mt-10 border-t border-slate-800 pt-8">
          <h2 className="text-sm font-semibold text-slate-200">School ID (tenant)</h2>
          <p className="mt-1 text-xs text-slate-500">
            UUID from onboarding after you claim your school. Paste the full value (e.g. eight hex chars, hyphen, four,
            four, four, twelve)—all segments are required.
          </p>
          <form onSubmit={(e) => void submitSchool(e)} className="mt-3 space-y-3">
            <div>
              <label htmlFor="schoolId" className="block text-xs text-slate-500">
                School ID
              </label>
              <input
                id="schoolId"
                type="text"
                autoComplete="off"
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                value={schoolId}
                onChange={(e) => setSchoolId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-sm text-white outline-none focus:border-emerald-500"
              />
            </div>
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-lg border border-slate-600 py-2.5 text-sm font-semibold text-slate-100 disabled:opacity-60"
            >
              {busy ? "Signing in…" : "Sign in with School ID"}
            </button>
          </form>
        </section>

        {error ? <p className="mt-6 text-sm text-rose-400">{error}</p> : null}

        <DemoContextSelectors />

        <div className="mt-8 flex flex-wrap gap-4 text-sm">
          <Link href="/register" className="text-cyan-400 underline">
            Create account
          </Link>
          <Link href="/pricing" className="text-cyan-400 underline">
            Pricing
          </Link>
          <Link href="/onboarding" className="text-cyan-400 underline">
            Claim school
          </Link>
        </div>
      </div>
    </main>
  );
}
