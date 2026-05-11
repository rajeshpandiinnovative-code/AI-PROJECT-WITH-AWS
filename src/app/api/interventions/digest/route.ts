import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/src/lib/db";
import { cleanEnv } from "@/src/lib/env";
import { schools } from "@/src/db/schema";
import { generateDailyDigestForSchool } from "@/src/lib/intervention-digest";

const bodySchema = z.object({
  schoolId: z.string().uuid().optional(),
  limit: z.number().int().min(1).max(500).optional(),
  dryRun: z.boolean().optional(),
});

function extractToken(request: Request): string {
  const fromHeader = request.headers.get("x-cron-token");
  if (fromHeader) return fromHeader.trim();
  const authHeader = request.headers.get("authorization");
  if (authHeader?.toLowerCase().startsWith("bearer ")) {
    return authHeader.slice(7).trim();
  }
  return "";
}

export async function POST(request: Request) {
  try {
    const expectedToken = cleanEnv(process.env.DIGEST_CRON_TOKEN);
    if (!expectedToken) {
      return NextResponse.json({ error: "DIGEST_CRON_TOKEN is not configured" }, { status: 503 });
    }

    const providedToken = extractToken(request);
    if (!providedToken || providedToken !== expectedToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let parsedBody: z.infer<typeof bodySchema> = {};
    try {
      parsedBody = bodySchema.parse(await request.json());
    } catch {
      parsedBody = {};
    }

    let schoolIds: string[] = [];
    if (parsedBody.schoolId) {
      schoolIds = [parsedBody.schoolId];
    } else {
      const limit = parsedBody.limit ?? 200;
      const rows = await db.select({ id: schools.id }).from(schools).limit(limit);
      schoolIds = rows.map((row) => row.id);
    }
    const dryRun = parsedBody.dryRun === true;

    if (dryRun) {
      return NextResponse.json(
        {
          data: {
            dryRun: true,
            processedSchools: schoolIds.length,
            schoolIds,
          },
        },
        { status: 200 },
      );
    }

    const summaries: Array<{ schoolId: string; digestDate: string; openCount: number; overdueCount: number; criticalCount: number }> = [];
    for (const schoolId of schoolIds) {
      const { digestDate, summary } = await generateDailyDigestForSchool(schoolId, "cron");
      summaries.push({
        schoolId,
        digestDate,
        openCount: summary.openCount,
        overdueCount: summary.overdueCount,
        criticalCount: summary.criticalCount,
      });
    }

    return NextResponse.json(
      {
        data: {
          processedSchools: schoolIds.length,
          summaries,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to generate daily digest";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
