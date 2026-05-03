import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { db } from "@/src/lib/db";

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
  };

  const session = await auth();
  checks.auth.schoolIdPresent = Boolean(session?.user?.schoolId);
  checks.auth.ok = checks.auth.schoolIdPresent;

  checks.vision.usingVisionApiKey = Boolean(process.env.GOOGLE_CLOUD_VISION_API_KEY);
  checks.vision.ok = checks.vision.usingVisionApiKey;

  checks.gemini.ok = Boolean(process.env.GEMINI_API_KEY);
  checks.rubric.ok = Boolean(process.env.MARKING_RUBRIC);

  try {
    await db.execute(sql`select 1`);
    checks.database.ok = true;
  } catch (error) {
    checks.database.ok = false;
    checks.database.error = error instanceof Error ? error.message : "Unknown DB error";
  }

  const ok =
    checks.auth.ok && checks.database.ok && checks.vision.ok && checks.gemini.ok && checks.rubric.ok;

  return NextResponse.json(
    {
      ok,
      timestamp: new Date().toISOString(),
      checks,
    },
    {
      status: ok ? 200 : 503,
    },
  );
}

