import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { logDemoApiUse } from "@/src/lib/demo-access";
import { cleanEnv } from "@/src/lib/env";
import { resolveGeminiModel } from "@/src/lib/gemini-runtime-model";
import { paidAccessGuardResponse } from "@/src/lib/subscription";
import { describeGeminiExtractionFailure, extractGeminiGeneratedText } from "@/src/lib/gemini-response";

const bodySchema = z.object({
  grade: z.string().min(1).max(50),
  subject: z.string().min(1).max(80),
  topic: z.string().min(1).max(120),
  style: z.enum(["exam", "quick-revision", "conceptual"]),
});

export async function POST(request: Request) {
  try {
    const session = await auth();
    const blocked = await paidAccessGuardResponse(session);
    if (blocked) {
      return blocked;
    }

    const apiKey = cleanEnv(process.env.GEMINI_API_KEY);
    const model = await resolveGeminiModel();
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_CONFIG_MISSING" }, { status: 503 });
    }

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const { grade, subject, topic, style } = parsed.data;
    const prompt = [
      "You are AI Academy Pro Notes Generator.",
      "Create concise student notes in plain text.",
      "Use this format:",
      "Summary:",
      "Key Points:",
      "Formula/Definitions:",
      "Common Mistakes:",
      "One-Minute Revision:",
      "",
      `Grade: ${grade}`,
      `Subject: ${subject}`,
      `Topic: ${topic}`,
      `Style: ${style}`,
    ].join("\n");

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.35,
            maxOutputTokens: 1000,
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
        { error: "GEMINI_REQUEST_FAILED", upstreamStatus: response.status, upstreamBody: upstream.slice(0, 800) },
        { status: 502 },
      );
    }

    const payload: unknown = await response.json();
    const extracted = extractGeminiGeneratedText(payload);
    if (!extracted.text) {
      return NextResponse.json({ error: describeGeminiExtractionFailure(extracted) }, { status: 502 });
    }

    await logDemoApiUse("api_notes_generator", { grade, subject, topic, style });
    return NextResponse.json({ notes: extracted.text }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to generate notes";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
