import { NextResponse } from "next/server";
import { z } from "zod";

import { cleanEnv, getGeminiModel } from "@/src/lib/env";

const bodySchema = z.object({
  grade: z.string().min(1).max(50),
  subject: z.string().min(1).max(80),
  topic: z.string().min(1).max(120),
  style: z.enum(["exam", "quick-revision", "conceptual"]),
});

type GeminiPayload = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
};

export async function POST(request: Request) {
  try {
    const apiKey = cleanEnv(process.env.GEMINI_API_KEY);
    const model = getGeminiModel();
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

    const payload = (await response.json()) as GeminiPayload;
    const notes = payload.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!notes) {
      return NextResponse.json({ error: "GEMINI_EMPTY_RESPONSE" }, { status: 502 });
    }

    return NextResponse.json({ notes }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to generate notes";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
