"use client";

import { useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";

type HealthPayload = {
  ok: boolean;
  pilotReady?: boolean;
  timestamp: string;
  checks: {
    auth: { ok: boolean; schoolIdPresent: boolean };
    database: { ok: boolean; error: string | null };
    vision: { ok: boolean; usingVisionApiKey: boolean };
    gemini: { ok: boolean };
    rubric: { ok: boolean };
  };
};

export default function HealthPage() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [payload, setPayload] = useState<HealthPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [schoolId, setSchoolId] = useState("");
  const [signInError, setSignInError] = useState<string | null>(null);
  const [copyState, setCopyState] = useState<"idle" | "curl" | "powershell">("idle");
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://your-domain.com";
  const cronCurl = `curl -X POST "${baseUrl}/api/interventions/digest" \\
  -H "x-cron-token: $DIGEST_CRON_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"limit":200}'`;
  const cronPowerShell = `Invoke-RestMethod -Uri "${baseUrl}/api/interventions/digest" -Method POST \\
  -Headers @{ "x-cron-token" = $env:DIGEST_CRON_TOKEN } \\
  -ContentType "application/json" \\
  -Body '{"limit":200}'`;

  async function runHealthCheck() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/health", { method: "GET", cache: "no-store" });
      const data = (await response.json()) as HealthPayload;

      if (!response.ok) {
        setPayload(data);
        setError("Infrastructure check failed (database or required env). Review details below.");
        return;
      }

      setPayload(data);
      setError(null);
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : "Health check failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handlePilotSignIn(event: React.FormEvent) {
    event.preventDefault();
    setSignInError(null);

    const trimmed = schoolId.trim();
    if (!trimmed) {
      setSignInError("Enter a school ID (UUID from your schools table).");
      return;
    }

    const result = await signIn("credentials", {
      schoolId: trimmed,
      redirect: false,
    });

    if (result?.error) {
      setSignInError("Sign-in failed. Check the school ID and try again.");
      return;
    }

    setSchoolId("");
  }

  async function copyCommand(type: "curl" | "powershell") {
    const text = type === "curl" ? cronCurl : cronPowerShell;
    try {
      await navigator.clipboard.writeText(text);
      setCopyState(type);
      window.setTimeout(() => setCopyState("idle"), 1500);
    } catch {
      setCopyState("idle");
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-4 px-4 py-10">
      <h1 className="text-2xl font-semibold">Deploy Health Check</h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Verifies database connectivity, Vision, Gemini, rubric, and optional pilot session. Top-level{" "}
        <code className="text-xs">ok</code> means infrastructure is ready; <code className="text-xs">pilotReady</code>{" "}
        is true when you are signed in with a school tenant (<code className="text-xs">schoolId</code> on the JWT).
      </p>

      <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Pilot session</h2>
        <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
          Session: {status === "loading" ? "…" : status}
          {session?.user?.schoolId ? (
            <>
              {" "}
              · schoolId: <code className="text-xs">{session.user.schoolId}</code>
            </>
          ) : null}
        </p>
        {status === "authenticated" ? (
          <button
            type="button"
            onClick={() => void signOut({ redirect: false })}
            className="mt-3 rounded border border-zinc-300 px-3 py-1.5 text-xs dark:border-zinc-600"
          >
            Sign out
          </button>
        ) : (
          <form onSubmit={handlePilotSignIn} className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
            <label className="flex flex-1 flex-col gap-1 text-xs text-zinc-600 dark:text-zinc-400">
              School ID (UUID)
              <input
                value={schoolId}
                onChange={(e) => setSchoolId(e.target.value)}
                placeholder="00000000-0000-0000-0000-000000000000"
                className="rounded border border-zinc-300 px-2 py-1.5 font-mono text-sm dark:border-zinc-600 dark:bg-zinc-900"
                autoComplete="off"
              />
            </label>
            <button
              type="submit"
              className="rounded bg-black px-4 py-2 text-sm text-white dark:bg-white dark:text-black"
            >
              Sign in (pilot)
            </button>
          </form>
        )}
        {signInError ? <p className="mt-2 text-xs text-red-600 dark:text-red-400">{signInError}</p> : null}
      </section>

      <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Cron setup snippet</h2>
        <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
          Set <code className="text-xs">DIGEST_CRON_TOKEN</code> in environment, then schedule one of these commands daily.
        </p>
        <div className="mt-3 grid gap-3">
          <div>
            <div className="mb-1 flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">cURL</p>
              <button
                type="button"
                onClick={() => void copyCommand("curl")}
                className="rounded border border-zinc-300 px-2 py-0.5 text-[11px] dark:border-zinc-600"
              >
                {copyState === "curl" ? "Copied" : "Copy"}
              </button>
            </div>
            <pre className="overflow-auto rounded border border-zinc-200 bg-zinc-50 p-3 text-xs dark:border-zinc-800 dark:bg-zinc-950">
              {cronCurl}
            </pre>
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">PowerShell</p>
              <button
                type="button"
                onClick={() => void copyCommand("powershell")}
                className="rounded border border-zinc-300 px-2 py-0.5 text-[11px] dark:border-zinc-600"
              >
                {copyState === "powershell" ? "Copied" : "Copy"}
              </button>
            </div>
            <pre className="overflow-auto rounded border border-zinc-200 bg-zinc-50 p-3 text-xs dark:border-zinc-800 dark:bg-zinc-950">
              {cronPowerShell}
            </pre>
          </div>
        </div>
      </section>

      <button
        type="button"
        onClick={() => void runHealthCheck()}
        disabled={loading}
        className="w-fit rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-60 dark:bg-white dark:text-black"
      >
        {loading ? "Running..." : "Run Health Check"}
      </button>

      {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}

      {payload?.ok && payload.pilotReady === false ? (
        <p className="text-sm text-amber-800 dark:text-amber-200">
          Infrastructure is healthy. Sign in with a school ID to set <code className="text-xs">pilotReady</code> to{" "}
          true.
        </p>
      ) : null}

      {payload ? (
        <pre className="overflow-auto rounded border border-zinc-200 bg-zinc-50 p-4 text-xs dark:border-zinc-800 dark:bg-zinc-950">
          {JSON.stringify(payload, null, 2)}
        </pre>
      ) : null}
    </main>
  );
}
