"use client";

import { useState } from "react";

type HealthPayload = {
  ok: boolean;
  timestamp: string;
  checks: {
    auth: { ok: boolean; schoolIdPresent: boolean };
    database: { ok: boolean; error: string | null };
    vision: { ok: boolean; usingInlineKeyJson: boolean; usingCredentialsPath: boolean };
    gemini: { ok: boolean };
    rubric: { ok: boolean };
  };
};

export default function HealthPage() {
  const [loading, setLoading] = useState(false);
  const [payload, setPayload] = useState<HealthPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runHealthCheck() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/health", { method: "GET", cache: "no-store" });
      const data = (await response.json()) as HealthPayload;

      if (!response.ok) {
        setPayload(data);
        setError("Some checks failed. Review statuses below.");
        return;
      }

      setPayload(data);
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : "Health check failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-4 px-4 py-10">
      <h1 className="text-2xl font-semibold">Deploy Health Check</h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Verifies session tenant, database connectivity, Vision credentials, Gemini key, and rubric.
      </p>

      <button
        type="button"
        onClick={runHealthCheck}
        disabled={loading}
        className="w-fit rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-60 dark:bg-white dark:text-black"
      >
        {loading ? "Running..." : "Run Health Check"}
      </button>

      {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}

      {payload ? (
        <pre className="overflow-auto rounded border border-zinc-200 bg-zinc-50 p-4 text-xs dark:border-zinc-800 dark:bg-zinc-950">
          {JSON.stringify(payload, null, 2)}
        </pre>
      ) : null}
    </main>
  );
}

