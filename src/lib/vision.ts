import { z } from "zod";

import { isMockApiMode } from "@/src/lib/api-mode";
import { cleanEnv } from "@/src/lib/env";

const MAX_OCR_IMAGE_BYTES = 5 * 1024 * 1024;

const visionResponseSchema = z.object({
  responses: z
    .array(
      z.object({
        fullTextAnnotation: z
          .object({
            text: z.string().optional(),
          })
          .optional(),
        error: z
          .object({
            message: z.string().optional(),
          })
          .optional(),
      }),
    )
    .min(1),
});

type ExtractTextFromImageInput = {
  imageBuffer: Buffer;
  mimeType: string;
};

/**
 * Handwritten / dense text OCR via Google Cloud Vision REST.
 * Uses an API key (recommended for Next.js server routes). No Node SDK — avoids deprecated transitive deps.
 */
export async function extractTextFromImage(input: ExtractTextFromImageInput) {
  if (!["image/jpeg", "image/png"].includes(input.mimeType)) {
    throw new Error("UNSUPPORTED_IMAGE_TYPE");
  }

  if (input.imageBuffer.byteLength === 0) {
    throw new Error("EMPTY_IMAGE");
  }

  if (input.imageBuffer.byteLength > MAX_OCR_IMAGE_BYTES) {
    throw new Error("IMAGE_TOO_LARGE");
  }

  if (isMockApiMode()) {
    return {
      text: `[Credit-safe mock — Pinnacle Software Solution / Vision OCR]
Class X Mathematics (sample extract)
Q1. Solve: If α, β are roots of x² − 5x + 6 = 0, find α² + β².
Working: α+β=5, αβ=6 ⇒ α²+β² = (α+β)² − 2αβ = 25 − 12 = 13.
Q2. Physics: State Ohm's law. V = IR with SI units.`,
    };
  }

  const apiKey = cleanEnv(process.env.GOOGLE_CLOUD_VISION_API_KEY);

  if (!apiKey) {
    throw new Error("VISION_CONFIG_MISSING");
  }

  const endpoint = `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      requests: [
        {
          image: { content: input.imageBuffer.toString("base64") },
          features: [{ type: "DOCUMENT_TEXT_DETECTION" }],
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error("VISION_REQUEST_FAILED");
  }

  const payload = visionResponseSchema.parse(await response.json());
  const first = payload.responses[0];

  if (first.error?.message) {
    throw new Error(`VISION_API_ERROR: ${first.error.message}`);
  }

  const extractedText = first.fullTextAnnotation?.text?.trim() ?? "";

  if (!extractedText) {
    throw new Error("NO_TEXT_EXTRACTED");
  }

  return {
    text: extractedText,
  };
}
