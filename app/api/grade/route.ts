import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { gradeWithRubric } from "@/src/lib/grading";
import { extractTextFromImage } from "@/src/lib/vision";
import { createTenantContext } from "@/src/db/tenant-context";

const bodySchema = z.object({
  imageBase64: z.string().min(1),
  maxMarks: z.number().int().positive().max(1000).optional(),
});

function classifyError(message: string) {
  if (message.includes("Tenant context")) {
    return 401;
  }

  if (
    message === "UNSUPPORTED_IMAGE_TYPE" ||
    message === "IMAGE_TOO_LARGE" ||
    message === "EMPTY_IMAGE" ||
    message === "Invalid JSON body" ||
    message === "Invalid request body"
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

  return 500;
}

export async function POST(request: Request) {
  const startedAt = Date.now();
  const requestId = crypto.randomUUID();

  try {
    createTenantContext(await auth());

    let jsonUnknown: unknown;
    try {
      jsonUnknown = await request.json();
    } catch {
      throw new Error("Invalid JSON body");
    }

    const parsed = bodySchema.safeParse(jsonUnknown);
    if (!parsed.success) {
      throw new Error("Invalid request body");
    }

    const { imageBase64, maxMarks } = parsed.data;

    let buffer: Buffer;
    try {
      buffer = Buffer.from(imageBase64, "base64");
    } catch {
      throw new Error("Invalid request body");
    }

    const { text } = await extractTextFromImage({
      imageBuffer: buffer,
      mimeType: "image/jpeg",
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

    console.info("grade:success", {
      requestId,
      elapsedMs: Date.now() - startedAt,
    });

    return NextResponse.json(
      { score: grading.marks, feedback: grading.feedback },
      { status: 200 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to grade paper";
    const status = classifyError(message);

    console.error("grade:failure", {
      requestId,
      status,
      message,
      elapsedMs: Date.now() - startedAt,
    });

    return NextResponse.json({ error: message }, { status });
  }
}
