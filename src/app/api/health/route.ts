import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { pingDatabase } from "@/src/lib/db";
import { cleanEnv } from "@/src/lib/env";

function formatDbError(error: unknown): string {
  if (!(error instanceof Error)) {
    return "Unknown DB error";
  }
  const msg = error.message;
  const cause = (error as Error & { cause?: unknown }).cause;
  if (cause instanceof Error && cause.message) {
    return `${msg} (${cause.message})`;
  }
  return msg;
}

export async function GET() {
  const checks = {
    auth: {
      ok: false,
      schoolIdPresent: false,
    },
    database: {
      ok: false,
      error: null as string | null,
    },
    vision: {
      ok: false,
      usingVisionApiKey: false,
    },
    gemini: {
      ok: false,
    },
    rubric: {
      ok: false,
    },
    digestAutomation: {
      ok: false,
      cronTokenConfigured: false,
    },
  };

  const session = await auth();
  checks.auth.schoolIdPresent = Boolean(session?.user?.schoolId);
  checks.auth.ok = checks.auth.schoolIdPresent;

  checks.vision.usingVisionApiKey = Boolean(process.env.GOOGLE_CLOUD_VISION_API_KEY);
  checks.vision.ok = checks.vision.usingVisionApiKey;

  checks.gemini.ok = Boolean(process.env.GEMINI_API_KEY);
  checks.rubric.ok = Boolean(process.env.MARKING_RUBRIC);
  checks.digestAutomation.cronTokenConfigured = Boolean(cleanEnv(process.env.DIGEST_CRON_TOKEN));
  checks.digestAutomation.ok = checks.digestAutomation.cronTokenConfigured;

  try {
    await pingDatabase();
    checks.database.ok = true;
  } catch (error) {
    checks.database.ok = false;
    checks.database.error = formatDbError(error);
  }

  // Deploy / infra readiness (DB + keys). Auth is separate — tenant sign-in is optional for probes.
  const infrastructureOk =
    checks.database.ok && checks.vision.ok && checks.gemini.ok && checks.rubric.ok && checks.digestAutomation.ok;
  const launchReady = infrastructureOk && checks.auth.ok;

  // pilotReady: deprecated alias for older probes — prefer launchReady
  return NextResponse.json(
    {
      ok: infrastructureOk,
      launchReady,
      pilotReady: launchReady,
      timestamp: new Date().toISOString(),
      checks,
    },
    {
      status: infrastructureOk ? 200 : 503,
    },
  );
}

