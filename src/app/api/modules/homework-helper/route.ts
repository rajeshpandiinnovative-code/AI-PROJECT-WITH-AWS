import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { cleanEnv, getGeminiModel } from "@/src/lib/env";
import { paidAccessGuardResponse } from "@/src/lib/subscription";
import { describeGeminiExtractionFailure, extractGeminiGeneratedText } from "@/src/lib/gemini-response";

const bodySchema = z.object({
  standard: z.string().min(1).max(50),
  subject: z.string().min(1).max(80),
  topic: z.string().min(1).max(120),
  question: z.string().min(1).max(2000),
});

export async function POST(request: Request) {
  try {
    const session = await auth();
    const blocked = await paidAccessGuardResponse(session);
    if (blocked) {
      return blocked;
    }

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

    const payload: unknown = await response.json();
    const extracted = extractGeminiGeneratedText(payload);
    if (!extracted.text) {
      return NextResponse.json({ error: describeGeminiExtractionFailure(extracted) }, { status: 502 });
    }

    return NextResponse.json({ answer: extracted.text }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to process request";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
