import { NextResponse } from "next/server";
import { z } from "zod";

import { cleanEnv, getGeminiModel } from "@/src/lib/env";

const bodySchema = z.object({
  standard: z.string().min(1).max(50),
  subject: z.string().min(1).max(80),
  topic: z.string().min(1).max(120),
  question: z.string().min(1).max(2000),
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

    const { standard, subject, topic, question } = parsed.data;
    const prompt = [
      "You are AI Academy Pro Homework Helper.",
      "Return concise and student-safe educational guidance.",
      "Output in plain text with this exact structure:",
      "Concept:",
      "Step-by-step:",
      "Common mistake:",
      "Try this next:",
      "",
      `Class: ${standard}`,
      `Subject: ${subject}`,
      `Topic: ${topic}`,
      `Question: ${question}`,
    ].join("\n");

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 700,
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
          error: "GEMINI_REQUEST_FAILED",
          upstreamStatus: response.status,
          upstreamBody: upstream.slice(0, 800),
        },
        { status: 502 },
      );
    }

    const payload = (await response.json()) as GeminiPayload;
    const answer = payload.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!answer) {
      return NextResponse.json({ error: "GEMINI_EMPTY_RESPONSE" }, { status: 502 });
    }

    return NextResponse.json({ answer }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to process request";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
