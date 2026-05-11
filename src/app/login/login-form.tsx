"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { PublicSiteHeader } from "@/src/components/landing/PublicSiteHeader";
import { DemoLoginPanel } from "@/src/components/login/DemoLoginPanel";

type Props = {
  registered?: boolean;
  /** Landing “Demo login” — full sign-in forms hidden; saves context and sends user to /modules. */
  demoMode?: boolean;
};

export function LoginForm({ registered, demoMode }: Props) {
  const [founderMode, setFounderMode] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [debugOtp, setDebugOtp] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const normalizePhoneNumber = (value: string): string => value.replace(/[^\d]/g, "").slice(-10);

  const requestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const normalizedPhone = normalizePhoneNumber(phoneNumber);
    if (normalizedPhone.length !== 10) {
      setError("Enter a valid 10-digit mobile number.");
      setBusy(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/mobile/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: normalizedPhone }),
      });

      const payload = (await response.json()) as { error?: string; debugOtp?: string };
      if (!response.ok || payload.error) {
        setError(payload.error ?? "Could not send OTP.");
        setBusy(false);
        return;
      }

      setOtpSent(true);
      setDebugOtp(payload.debugOtp ?? null);
      setBusy(false);
    } catch {
      setError("Could not send OTP.");
      setBusy(false);
    }
  };

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await signIn("credentials", {
        phoneNumber: normalizePhoneNumber(phoneNumber),
        otp: otp.trim(),
        redirect: false,
      });
      if (res?.error) {
        setError("Invalid OTP or OTP expired. Request a new OTP.");
        setBusy(false);
        return;
      }
      setBusy(false);
      window.location.assign("/dashboard");
    } catch {
      setError("OTP verification failed.");
      setBusy(false);
    }
  };

  const submitFounder = async (e: React.FormEvent) => {
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
        const err = String(res.error);
        setError(
          err === "Configuration"
            ? "Sign-in is misconfigured. Add AUTH_SECRET to .env.local (e.g. openssl rand -base64 32), optionally AUTH_URL=http://localhost:3000, restart the dev server, and try again."
            : "Email or password was not recognized.",
        );
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

  if (demoMode) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100">
        <PublicSiteHeader activeAuth="demo" />
        <div className="px-4 py-12">
          <div className="mx-auto max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8">
            <DemoLoginPanel />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <PublicSiteHeader activeAuth="login" />
      <div className="px-4 py-12">
        <div className="mx-auto max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8">
        <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">AI Academy Pro</p>
        <h1 className="mt-3 text-2xl font-bold text-white">Sign in</h1>
        {registered ? (
          <p className="mt-3 text-sm text-emerald-400">Account created — use mobile OTP to sign in.</p>
        ) : (
          <p className="mt-3 text-sm text-slate-400">
            Paid users: register first, then sign in with mobile OTP.
          </p>
        )}

        {!founderMode ? (
          <section className="mt-8">
            <h2 className="text-sm font-semibold text-slate-200">Mobile number</h2>
            {!otpSent ? (
              <form onSubmit={(e) => void requestOtp(e)} className="mt-3 space-y-3">
                <div>
                  <label htmlFor="phoneNumber" className="block text-xs text-slate-500">
                    Phone
                  </label>
                  <input
                    id="phoneNumber"
                    type="tel"
                    autoComplete="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required
                    placeholder="10-digit mobile number"
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={busy}
                  className="w-full rounded-lg bg-emerald-500 py-2.5 text-sm font-semibold text-slate-950 disabled:opacity-60"
                >
                  {busy ? "Sending OTP…" : "Send OTP"}
                </button>
              </form>
            ) : (
              <form onSubmit={(e) => void verifyOtp(e)} className="mt-3 space-y-3">
                <div>
                  <label htmlFor="otp" className="block text-xs text-slate-500">
                    Enter OTP
                  </label>
                  <input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                    placeholder="6-digit OTP"
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
                  />
                </div>
                {debugOtp ? (
                  <p className="text-xs text-amber-300">Dev OTP: <span className="font-mono">{debugOtp}</span></p>
                ) : null}
                <button
                  type="submit"
                  disabled={busy}
                  className="w-full rounded-lg bg-emerald-500 py-2.5 text-sm font-semibold text-slate-950 disabled:opacity-60"
                >
                  {busy ? "Verifying…" : "Verify OTP"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOtpSent(false);
                    setOtp("");
                    setDebugOtp(null);
                  }}
                  className="w-full rounded-lg border border-slate-600 py-2.5 text-sm font-semibold text-slate-100"
                >
                  Change number
                </button>
              </form>
            )}
          </section>
        ) : (
          <section className="mt-8">
            <h2 className="text-sm font-semibold text-slate-200">Founder admin login</h2>
            <form onSubmit={(e) => void submitFounder(e)} className="mt-3 space-y-3">
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
        )}

        {error ? <p className="mt-6 text-sm text-rose-400">{error}</p> : null}

        <button
          type="button"
          onClick={() => {
            setFounderMode((prev) => !prev);
            setError(null);
            setBusy(false);
          }}
          className="mt-5 text-xs text-cyan-400 underline"
        >
          {founderMode ? "Back to Mobile Login" : "Admin Login"}
        </button>

        <div className="mt-8 flex flex-wrap gap-4 text-sm">
          <Link href="/register" className="text-cyan-400 underline">
            Register paid account
          </Link>
          <Link href="/pricing" className="text-cyan-400 underline">
            Pricing
          </Link>
          <Link href="/onboarding" className="text-cyan-400 underline">
            Claim school
          </Link>
        </div>
        </div>
      </div>
    </main>
  );
}
