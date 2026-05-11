import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { logDemoApiUse } from "@/src/lib/demo-access";
import { cleanEnv, getGeminiImageModel } from "@/src/lib/env";
import {
  describeGeminiExtractionFailure,
  extractGeminiGeneratedText,
  extractGeminiInlineImages,
} from "@/src/lib/gemini-response";
import { paidAccessGuardResponse } from "@/src/lib/subscription";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  prompt: z.string().min(1).max(4000),
});

/**
 * Native Gemini image generation uses image-capable models (e.g. `gemini-2.5-flash-image`),
 * not the default text `GEMINI_MODEL`. Set `GEMINI_IMAGE_MODEL` if needed.
 */
export async function POST(request: Request) {
  try {
    const session = await auth();
    const blocked = await paidAccessGuardResponse(session);
    if (blocked) {
      return blocked;
    }

    const apiKey = cleanEnv(process.env.GEMINI_API_KEY);
    const model = getGeminiImageModel();
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_CONFIG_MISSING" }, { status: 503 });
    }

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const { prompt } = parsed.data;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            responseModalities: ["TEXT", "IMAGE"],
          },
        }),
      },
    );

    if (!response.ok) {
      let upstream = "";
      try {
        upstream = await response.text();
      } catch {
        upstream = "";
      }
      return NextResponse.json(
        {
          error: "GEMINI_IMAGE_REQUEST_FAILED",
          upstreamStatus: response.status,
          upstreamBody: upstream.slice(0, 1200),
          hint: "Use an image model (set GEMINI_IMAGE_MODEL, e.g. gemini-2.5-flash-image or gemini-3.1-flash-image-preview).",
        },
        { status: 502 },
      );
    }

    const payload: unknown = await response.json();
    const images = extractGeminiInlineImages(payload);
    const extracted = extractGeminiGeneratedText(payload);

    if (images.length === 0) {
      const errMsg = extracted.text
        ? "GEMINI_IMAGE_MISSING:inline parts empty (model may be text-only)"
        : describeGeminiExtractionFailure(extracted);
      return NextResponse.json(
        {
          error: errMsg,
          caption: extracted.text || undefined,
          blockReason: extracted.blockReason,
          finishReason: extracted.finishReason,
        },
        { status: 502 },
      );
    }

    const dataUrls = images.map((img) => ({
      mimeType: img.mimeType,
      dataUrl: `data:${img.mimeType};base64,${img.dataBase64}`,
    }));

    await logDemoApiUse("api_generate_image", {
      imageCount: dataUrls.length,
      promptLen: prompt.length,
    });
    return NextResponse.json(
      {
        caption: extracted.text || undefined,
        images: dataUrls,
      },
      { status: 200 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to generate image";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
