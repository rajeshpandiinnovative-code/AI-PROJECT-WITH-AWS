import { and, desc, eq, gte, lte } from "drizzle-orm";
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { db } from "@/src/lib/db";
import { paidAccessGuardResponse } from "@/src/lib/subscription";
import { interventionAuditLogs, interventionDailyDigests, interventionTasks } from "@/src/db/schema";

function toCsvCell(value: unknown): string {
  const normalized = String(value ?? "");
  const escaped = normalized.replace(/"/g, '""');
  return `"${escaped}"`;
}

function buildCsv(headers: string[], rows: Array<Array<unknown>>): string {
  const head = headers.map(toCsvCell).join(",");
  const body = rows.map((row) => row.map(toCsvCell).join(",")).join("\n");
  return body ? `${head}\n${body}\n` : `${head}\n`;
}

export async function GET(request: Request) {
  try {
    const session = await auth();
    const schoolId = session?.user?.schoolId;
    if (!schoolId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const blocked = await paidAccessGuardResponse(session);
    if (blocked) {
      return blocked;
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");
    const moduleParam = searchParams.get("module");
    const actionTypeParam = searchParams.get("actionType");

    const fromDate = fromParam ? new Date(fromParam) : null;
    const toDate = toParam ? new Date(toParam) : null;
    if (fromDate && Number.isNaN(fromDate.getTime())) {
      return NextResponse.json({ error: "Invalid from date" }, { status: 400 });
    }
    if (toDate && Number.isNaN(toDate.getTime())) {
      return NextResponse.json({ error: "Invalid to date" }, { status: 400 });
    }
    if (fromDate && toDate && fromDate > toDate) {
      return NextResponse.json({ error: "from must be <= to" }, { status: 400 });
    }
    if (moduleParam && moduleParam.length > 128) {
      return NextResponse.json({ error: "Invalid module filter" }, { status: 400 });
    }
    if (actionTypeParam && actionTypeParam.length > 64) {
      return NextResponse.json({ error: "Invalid actionType filter" }, { status: 400 });
    }

    if (type === "tracker") {
      const tasks = await db.query.interventionTasks.findMany({
        where: and(
          eq(interventionTasks.schoolId, schoolId),
          moduleParam ? eq(interventionTasks.recommendedModule, moduleParam) : undefined,
          fromDate ? gte(interventionTasks.createdAt, fromDate) : undefined,
          toDate ? lte(interventionTasks.createdAt, toDate) : undefined,
        ),
        orderBy: [desc(interventionTasks.createdAt)],
        limit: 1000,
      });

      const csv = buildCsv(
        ["id", "studentName", "examName", "marks", "recommendedModule", "status", "createdAt", "updatedAt"],
        tasks.map((task) => [
          task.id,
          task.studentName,
          task.examName,
          task.marks,
          task.recommendedModule,
          task.status,
          task.createdAt.toISOString(),
          task.updatedAt.toISOString(),
        ]),
      );

      return new Response(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": 'attachment; filename="intervention-tracker.csv"',
          "Cache-Control": "no-store",
        },
      });
    }

    if (type === "audit") {
      const logs = await db.query.interventionAuditLogs.findMany({
        where: and(
          eq(interventionAuditLogs.schoolId, schoolId),
          actionTypeParam ? eq(interventionAuditLogs.actionType, actionTypeParam) : undefined,
          fromDate ? gte(interventionAuditLogs.createdAt, fromDate) : undefined,
          toDate ? lte(interventionAuditLogs.createdAt, toDate) : undefined,
        ),
        orderBy: [desc(interventionAuditLogs.createdAt)],
        limit: 1000,
      });

      const csv = buildCsv(
        ["id", "actionType", "affectedCount", "metadata", "createdAt"],
        logs.map((log) => [
          log.id,
          log.actionType,
          log.affectedCount,
          JSON.stringify(log.metadata ?? {}),
          log.createdAt.toISOString(),
        ]),
      );

      return new Response(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": 'attachment; filename="intervention-audit.csv"',
          "Cache-Control": "no-store",
        },
      });
    }

    if (type === "digest") {
      const digests = await db.query.interventionDailyDigests.findMany({
        where: and(
          eq(interventionDailyDigests.schoolId, schoolId),
          fromDate ? gte(interventionDailyDigests.createdAt, fromDate) : undefined,
          toDate ? lte(interventionDailyDigests.createdAt, toDate) : undefined,
        ),
        orderBy: [desc(interventionDailyDigests.createdAt)],
        limit: 365,
      });

      const csv = buildCsv(
        ["id", "digestDate", "openCount", "overdueCount", "criticalCount", "topAtRiskStudents", "createdAt", "updatedAt"],
        digests.map((d) => {
          const summary = (d.summary ?? {}) as Record<string, unknown>;
          return [
            d.id,
            d.digestDate,
            summary.openCount ?? "",
            summary.overdueCount ?? "",
            summary.criticalCount ?? "",
            JSON.stringify(summary.topAtRiskStudents ?? []),
            d.createdAt.toISOString(),
            d.updatedAt.toISOString(),
          ];
        }),
      );

      return new Response(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": 'attachment; filename="intervention-digest.csv"',
          "Cache-Control": "no-store",
        },
      });
    }

    return NextResponse.json({ error: "Invalid export type. Use type=tracker, type=audit, or type=digest" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to export interventions";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
