import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { isMockApiMode } from "@/src/lib/api-mode";
import { buildMockQuizBlock } from "@/src/lib/credit-safe-mocks";
import { logDemoApiUse } from "@/src/lib/demo-access";
import { cleanEnv } from "@/src/lib/env";
import { resolveGeminiModel } from "@/src/lib/gemini-runtime-model";
import { paidAccessGuardResponse } from "@/src/lib/subscription";
import { describeGeminiExtractionFailure, extractGeminiGeneratedText } from "@/src/lib/gemini-response";

const bodySchema = z.object({
  grade: z.string().min(1).max(50),
  subject: z.string().min(1).max(80),
  topic: z.string().min(1).max(120),
  difficulty: z.enum(["easy", "medium", "hard"]),
  questionCount: z.number().int().min(3).max(10),
});

function buildFallbackQuiz(topic: string, subject: string, questionCount: number) {
  return {
    quiz: Array.from({ length: questionCount }, (_, idx) => {
      const n = idx + 1;
      return {
        question: `${subject}: ${topic} practice question ${n}. Which approach is best first?`,
        options: [
          "Recall the concept definition",
          "Skip fundamentals",
          "Memorize without understanding",
          "Avoid practice",
        ],
        answer: "Recall the concept definition",
        explanation: "Starting with core concepts improves accuracy before advanced practice.",
      };
    }),
  };
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    const blocked = await paidAccessGuardResponse(session);
    if (blocked) {
      return blocked;
    }

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const { grade, subject, topic, difficulty, questionCount } = parsed.data;

    if (isMockApiMode()) {
      const data = buildMockQuizBlock(topic, subject, questionCount);
      await logDemoApiUse("api_quiz_generator", {
        grade,
        subject,
        topic,
        difficulty,
        questionCount,
      });
      return NextResponse.json({ data }, { status: 200 });
    }

    const apiKey = cleanEnv(process.env.GEMINI_API_KEY);
    const model = await resolveGeminiModel();
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_CONFIG_MISSING" }, { status: 503 });
    }

    const prompt = [
      "You are AI Academy Pro Quiz Generator.",
      "Return only valid JSON with this exact shape:",
      '{ "quiz": [ { "question": string, "options": string[4], "answer": string, "explanation": string } ] }',
      "No markdown, no extra keys.",
      "",
      `Grade: ${grade}`,
      `Subject: ${subject}`,
      `Topic: ${topic}`,
      `Difficulty: ${difficulty}`,
      `Question Count: ${questionCount}`,
    ].join("\n");

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 1400,
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
    const raw = extracted.text;

    const normalized = raw
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    let parsedQuiz: unknown = null;
    try {
      parsedQuiz = JSON.parse(normalized);
    } catch {
      parsedQuiz = buildFallbackQuiz(topic, subject, questionCount);
    }

    await logDemoApiUse("api_quiz_generator", {
      grade,
      subject,
      topic,
      difficulty,
      questionCount,
    });
    return NextResponse.json({ data: parsedQuiz }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to generate quiz";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
