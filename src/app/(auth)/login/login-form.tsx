"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { PublicSiteHeader } from "@/src/components/landing/PublicSiteHeader";
import { DemoLoginPanel } from "@/src/components/login/DemoLoginPanel";
import { DEV_MASTER_OTP_CLIENT, PILOT_SEED_PHONE_SCHOOL_A_MANAGEMENT } from "@/src/lib/dev-auth-public";

type Props = {
  registered?: boolean;
  /** Landing “Demo login” — full sign-in forms hidden; saves context and sends user to /modules. */
  demoMode?: boolean;
  /** `/login?mobile=1` or `otp=1` — show mobile OTP first (old default). */
  preferMobileLogin?: boolean;
  /** Server: `AUTH_GOOGLE_ID` + `AUTH_GOOGLE_SECRET` set — show Google sign-in. */
  googleSignInEnabled?: boolean;
};

export function LoginForm({ registered, demoMode, preferMobileLogin, googleSignInEnabled }: Props) {
  const searchParams = useSearchParams();
  const urlError = searchParams.get("error");
  const [founderMode, setFounderMode] = useState(() => {
    if (preferMobileLogin) return false;
    return true;
  });
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
        const isDev = process.env.NODE_ENV === "development";
        const triedMaster = otp.trim() === DEV_MASTER_OTP_CLIENT;
        if (isDev && triedMaster) {
          setError(
            `Master OTP ${DEV_MASTER_OTP_CLIENT} was rejected. Use a phone that exists on platform_users (run npm run seed:local-pilot → try ${PILOT_SEED_PHONE_SCHOOL_A_MANAGEMENT}), or add DEV_MASTER_SIGNIN_EMAIL=pilot-owner-a@local.test to .env.local and retry.`,
          );
        } else if (isDev) {
          setError(
            `Invalid OTP or expired.${debugOtp ? ` Last debug OTP from Send OTP: ${debugOtp}.` : ""} In development you can also use master OTP ${DEV_MASTER_OTP_CLIENT} with seeded mobile ${PILOT_SEED_PHONE_SCHOOL_A_MANAGEMENT}.`,
          );
        } else {
          setError("Invalid OTP or OTP expired. Request a new OTP.");
        }
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

  const submitFounder = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const form = e.currentTarget;
    const fd = new FormData(form);
    const emailVal = String(fd.get("email") ?? email).trim();
    const passwordVal = String(fd.get("password") ?? password);
    try {
      const res = await signIn("credentials", {
        email: emailVal,
        password: passwordVal,
        redirect: false,
      });
      if (res?.error) {
        const err = String(res.error);
        let msg =
          err === "Configuration"
            ? "Sign-in is misconfigured. Add AUTH_SECRET to .env.local (e.g. openssl rand -base64 32), optionally AUTH_URL=http://localhost:3000, restart the dev server, and try again."
            : "We could not sign you in with that email and password.";

        if (err !== "Configuration" && emailVal) {
          try {
            const hintRes = await fetch("/api/auth/email-login-hint", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email: emailVal }),
            });
            const hint = (await hintRes.json()) as { exists?: boolean; passwordLoginAllowed?: boolean };
            if (hint?.exists === false) {
              msg = "No account exists for that email. Register first or use an email your school already added.";
            } else if (hint?.exists === true && hint?.passwordLoginAllowed === false && googleSignInEnabled) {
              msg =
                "This email is set up for Google sign-in. Use “Continue with Google” — password sign-in is not used for this account.";
            } else if (hint?.exists === true && googleSignInEnabled) {
              msg =
                "Incorrect password, or this account may use Google. Try again, or use “Continue with Google” if your workspace linked Google.";
            } else if (hint?.exists === true) {
              msg = "Incorrect password. Try again or use “Forgot password” from your school admin if available.";
            }
          } catch {
            /* keep msg */
          }
        }

        setError(msg);
        void fetch("/api/analytics/event", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventType: "login_failed",
            payload: { method: "email", email: emailVal },
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
          <p className="mt-3 text-sm text-emerald-400">
            Account created — sign in with email + password below, or switch to mobile OTP.
          </p>
        ) : (
          <p className="mt-3 text-sm text-slate-400">
            Use <strong className="text-slate-300">email + password</strong>
            {googleSignInEnabled ? (
              <>
                , <strong className="text-slate-300">Google</strong> (if your email exists in our directory)
              </>
            ) : null}{" "}
            (founder, pilot seeds, registered users). Switch to <strong className="text-slate-300">mobile OTP</strong>{" "}
            if you prefer phone sign-in.
          </p>
        )}

        {urlError === "no_platform_account" ? (
          <p className="mt-3 rounded-lg border border-amber-700/50 bg-amber-950/40 px-3 py-2 text-sm text-amber-200">
            Google sign-in is only available for emails already registered on AI Academy Pro. Use email + password or
            register first.
          </p>
        ) : null}

        {!demoMode && !founderMode ? (
          <p className="mt-2 text-xs text-slate-500">
            Prefer email and password? Use{" "}
            <span className="text-slate-400">“Use email &amp; password instead”</span> below, or open{" "}
            <Link href="/login" className="text-cyan-400 underline">
              /login
            </Link>{" "}
            without <span className="font-mono text-slate-400">?mobile=1</span>. Bookmark{" "}
            <Link href="/login?mobile=1" className="text-cyan-400 underline">
              /login?mobile=1
            </Link>{" "}
            to always land here first.
          </p>
        ) : null}

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
            <h2 className="text-sm font-semibold text-slate-200">Email &amp; password</h2>
            {googleSignInEnabled ? (
              <div className="mt-3 space-y-3">
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    void signIn("google", { callbackUrl: "/dashboard" });
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-600 bg-slate-950 py-2.5 text-sm font-semibold text-white hover:bg-slate-900"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continue with Google
                </button>
                <p className="text-center text-xs text-slate-500">or use email and password</p>
              </div>
            ) : null}
            <form onSubmit={(e) => void submitFounder(e)} className="mt-3 space-y-3">
              <div>
                <label htmlFor="email" className="block text-xs text-slate-500">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
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
                  name="password"
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
          {founderMode ? "Use mobile OTP instead" : "Use email & password instead"}
        </button>

        <div className="mt-8 flex flex-wrap gap-4 text-sm">
          <Link href="/register/account" className="text-cyan-400 underline">
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
