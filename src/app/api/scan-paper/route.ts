import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { recordResult, syncInterventionTasks } from "@/src/db/queries";
import { exams, students } from "@/src/db/schema";
import { db } from "@/src/lib/db";
import { gradeWithRubric } from "@/src/lib/grading";
import { extractTextFromImage } from "@/src/lib/vision";
import { createTenantContext } from "@/src/db/tenant-context";
import { paidAccessGuardResponse } from "@/src/lib/subscription";

const MAX_FILE_BYTES = 5 * 1024 * 1024;

const scanPaperFieldsSchema = z.object({
  studentId: z.string().uuid(),
  examId: z.string().uuid(),
  maxMarks: z.number().int().positive().max(1000).optional(),
});

function classifyError(message: string) {
  if (message.includes("Tenant context") || message.includes("Security Breach")) {
    return 401;
  }

  if (
    message === "UNSUPPORTED_IMAGE_TYPE" ||
    message === "IMAGE_TOO_LARGE" ||
    message === "EMPTY_IMAGE" ||
    message === "Invalid form fields" ||
    message === "Student not found in school" ||
    message === "Exam not found in school" ||
    message === "Student or exam not found in this school"
  ) {
    return 400;
  }

  if (
    message === "NO_TEXT_EXTRACTED" ||
    message === "GEMINI_INVALID_JSON" ||
    message === "GEMINI_EMPTY_RESPONSE"
  ) {
    return 422;
  }

  if (message === "MARKING_RUBRIC_MISSING") {
    return 503;
  }

  return 500;
}

export async function POST(request: Request) {
  const startedAt = Date.now();
  const requestId = crypto.randomUUID();

  try {
    const formData = await request.formData();

    const fields = scanPaperFieldsSchema.safeParse({
      studentId: formData.get("studentId"),
      examId: formData.get("examId"),
      maxMarks: formData.get("maxMarks") ? Number(formData.get("maxMarks")) : undefined,
    });

    if (!fields.success) {
      throw new Error("Invalid form fields");
    }

    const image = formData.get("image");
    if (!(image instanceof File)) {
      throw new Error("Invalid form fields");
    }

    if (image.size === 0) {
      throw new Error("EMPTY_IMAGE");
    }

    if (image.size > MAX_FILE_BYTES) {
      throw new Error("IMAGE_TOO_LARGE");
    }

    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { requestId, error: "Unauthorized", code: "UNAUTHORIZED" },
        { status: 401 },
      );
    }

    const blocked = await paidAccessGuardResponse(session);
    if (blocked) {
      return blocked;
    }
    const tenant = createTenantContext(session);

    const { studentId, examId, maxMarks } = fields.data;

    const [student] = await db
      .select({ id: students.id })
      .from(students)
      .where(and(eq(students.id, studentId), eq(students.schoolId, tenant.schoolId)))
      .limit(1);

    if (!student) {
      return NextResponse.json(
        {
          requestId,
          error:
            "No student in this school matches the selected ID. Confirm the learner is on your roster or rescan with the correct student.",
          code: "STUDENT_NOT_FOUND",
        },
        { status: 400 },
      );
    }

    const [exam] = await db
      .select({ id: exams.id })
      .from(exams)
      .where(and(eq(exams.id, examId), eq(exams.schoolId, tenant.schoolId)))
      .limit(1);

    if (!exam) {
      return NextResponse.json(
        {
          requestId,
          error:
            "No exam in this school matches the selected ID. Pick an exam from your schedule or create the paper first.",
          code: "EXAM_NOT_FOUND",
        },
        { status: 400 },
      );
    }

    const arrayBuffer = await image.arrayBuffer();
    const { text } = await extractTextFromImage({
      imageBuffer: Buffer.from(arrayBuffer),
      mimeType: image.type || "application/octet-stream",
    });

    const rubric = process.env.MARKING_RUBRIC;
    if (!rubric) {
      throw new Error("MARKING_RUBRIC_MISSING");
    }

    const grading = await gradeWithRubric({
      extractedText: text,
      rubric,
      maxMarks: maxMarks ?? 100,
    });

    const marksPersisted = Math.round(Math.min(Math.max(Number(grading.marks), 0), maxMarks ?? 100));
    const persisted = await recordResult(tenant.schoolId, {
      studentId,
      examId,
      marks: marksPersisted,
    });

    const interventionSync = await syncInterventionTasks(examId, tenant.schoolId);

    const elapsedMs = Date.now() - startedAt;
    console.info("scan-paper:success", {
      requestId,
      elapsedMs,
      interventionCandidates: interventionSync.upserted,
    });

    return NextResponse.json(
      {
        requestId,
        data: {
          studentId,
          examId,
          resultId: persisted?.id,
          extractedText: text,
          suggestedMarks: grading.marks,
          persistedMarks: marksPersisted,
          feedback: grading.feedback,
          confidence: grading.confidence,
          reasons: grading.reasons ?? [],
          interventionSync: {
            ran: true,
            failingResultsOnExam: interventionSync.upserted,
          },
        },
      },
      { status: 200 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to scan paper";
    const status = classifyError(message);

    console.error("scan-paper:failure", {
      requestId,
      status,
      message,
      elapsedMs: Date.now() - startedAt,
    });

    const body: Record<string, unknown> = { requestId, error: message };
    if (message === "Student or exam not found in this school") {
      body.code = "STUDENT_OR_EXAM_MISMATCH";
    }

    return NextResponse.json(body, { status });
  }
}
