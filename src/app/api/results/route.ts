import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { recordResult } from "@/src/db/queries";
import { createTenantContext } from "@/src/db/tenant-context";

type CreateResultBody = {
  studentId: string;
  examId: string;
  marks: number;
};

function parseBody(payload: unknown): CreateResultBody | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const body = payload as Partial<CreateResultBody>;

  if (
    typeof body.studentId !== "string" ||
    typeof body.examId !== "string" ||
    typeof body.marks !== "number" ||
    !Number.isFinite(body.marks)
  ) {
    return null;
  }

  return {
    studentId: body.studentId,
    examId: body.examId,
    marks: body.marks,
  };
}

export async function POST(request: Request) {
  try {
    const tenant = createTenantContext(await auth());
    const body = parseBody(await request.json());

    if (!body) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const result = await recordResult(tenant, body);

    return NextResponse.json({ data: result }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to record result";
    const status = message.includes("Tenant context") ? 401 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const examId = searchParams.get("examId");
    const limitParam = searchParams.get("limit");
    const cursor = searchParams.get("cursor") ?? undefined;

    if (!examId) {
      return NextResponse.json({ error: "examId is required" }, { status: 400 });
    }

    const parsedLimit = limitParam ? Number(limitParam) : undefined;
    if (parsedLimit !== undefined && (!Number.isInteger(parsedLimit) || parsedLimit <= 0)) {
      return NextResponse.json({ error: "limit must be a positive integer" }, { status: 400 });
    }

    const tenant = createTenantContext(await auth());

    const { listResultsForExamPaginated } = await import("@/src/db/queries");
    const { data, nextCursor } = await listResultsForExamPaginated(tenant, examId, {
      limit: parsedLimit,
      cursor,
    });

    return NextResponse.json({ data, nextCursor }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to fetch results";
    const status = message.includes("Tenant context")
      ? 401
      : message.includes("Invalid cursor")
        ? 400
        : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
