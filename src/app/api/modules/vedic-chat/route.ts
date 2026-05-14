import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { isMockApiMode } from "@/src/lib/api-mode";
import { MOCK_VEDIC_BODY } from "@/src/lib/credit-safe-mocks";
import {
  generateSocraticVedicResponse,
  generateAdaptiveLesson,
  formatAdaptiveLessonAsText,
} from "@/src/lib/MockDataEngine";
import { logDemoApiUse } from "@/src/lib/demo-access";
import { cleanEnv } from "@/src/lib/env";
import { resolveGeminiModel } from "@/src/lib/gemini-runtime-model";
import { paidAccessGuardResponse } from "@/src/lib/subscription";
import { describeGeminiExtractionFailure, extractGeminiGeneratedText } from "@/src/lib/gemini-response";

const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(8000),
});

const bodySchema = z
  .object({
    messages: z.array(chatMessageSchema).min(1).max(32),
    context: z.string().max(2000).optional(),
  })
  .refine((data) => data.messages[data.messages.length - 1]?.role === "user", {
    message: "Last message must be from the user",
  });

const legacyBodySchema = z.object({
  message: z.string().min(1).max(1200),
  context: z.string().max(2000).optional(),
});

const SYSTEM_INSTRUCTION_BASE = [
  "You are AI Academy Pro's Vedic Maths Tutor.",
  "Focus on school-level mathematics using Vedic Maths / Indian mental math (sutras, Nikhilam, Urdhva-Tiryak, divisibility tricks, speed arithmetic) unless the learner clearly switches topic.",
  "Teach in short, clear steps using plain text.",
  "Prioritize mental math tricks, base methods, and exam speed strategies.",
  "If asked something unrelated to math learning, briefly acknowledge and redirect to a relevant Vedic Maths idea.",
  "When answering a new problem, where helpful give: (1) concept summary (2) one worked example (3) one quick practice question with answer hint.",
  "Use conversation history: resolve references like \"that\", \"the previous question\", or \"why\" based on earlier turns.",
].join("\n");

type ChatMessage = z.infer<typeof chatMessageSchema>;

function splitLeadingAssistantMessages(messages: ChatMessage[]): { preamble: string; rest: ChatMessage[] } {
  const preambleParts: string[] = [];
  let i = 0;
  while (i < messages.length && messages[i].role === "assistant") {
    preambleParts.push(messages[i].content);
    i += 1;
  }
  return {
    preamble: preambleParts.join("\n\n"),
    rest: messages.slice(i),
  };
}

function parseBody(json: unknown): { messages: ChatMessage[]; context?: string } | null {
  const modern = bodySchema.safeParse(json);
  if (modern.success) {
    return modern.data;
  }
  const legacy = legacyBodySchema.safeParse(json);
  if (legacy.success) {
    return {
      messages: [{ role: "user", content: legacy.data.message }],
      context: legacy.data.context,
    };
  }
  return null;
}

export async function POST(request: Request) {
  try {
    const session = await auth();

    const userRole = (session?.user?.role ?? "").toUpperCase();
    if (userRole !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "This module is currently restricted to platform administrators." },
        { status: 403 },
      );
    }

    const blocked = await paidAccessGuardResponse(session);
    if (blocked) {
      return blocked;
    }

    let json: unknown;
    try {
      json = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = parseBody(json);
    if (!parsed) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const { messages, context } = parsed;
    const { preamble, rest } = splitLeadingAssistantMessages(messages);

    if (rest.length === 0) {
      return NextResponse.json({ error: "No user messages in conversation" }, { status: 400 });
    }

    if (isMockApiMode()) {
      await logDemoApiUse("api_vedic_chat", { messageCount: rest.length });
      const lastUser = rest.filter((m) => m.role === "user").pop()?.content ?? "";

      const multMatch = lastUser.match(/(\d+)\s*[x×*]\s*(\d+)/i)
        ?? lastUser.match(/(\d+)\s+times\s+(\d+)/i)
        ?? lastUser.match(/multiply\s+(\d+)\s*(?:and|by|with|,)\s*(\d+)/i);

      if (multMatch) {
        const a = parseInt(multMatch[1], 10);
        const b = parseInt(multMatch[2], 10);
        const phases = generateSocraticVedicResponse(a, b);
        const socratic = phases.map((p) => `${p.label}\n${p.content}`).join("\n\n");
        return NextResponse.json({ answer: socratic }, { status: 200 });
      }

      const techTopics = [
        "deepseek", "canva", "scratch", "python", "chatgpt", "gemini",
        "ai", "coding", "programming", "prompt", "design",
      ];
      const lower = lastUser.toLowerCase();
      const matchedTopic = techTopics.find((t) => lower.includes(t));
      if (matchedTopic) {
        const gradeMatch = lastUser.match(/(?:class|grade|std|standard)\s*(\d{1,2})/i)
          ?? lastUser.match(/(\d{1,2})(?:th|st|nd|rd)\s*(?:grade|class|std)/i);
        const grade = gradeMatch ? parseInt(gradeMatch[1], 10) : 8;
        const lesson = generateAdaptiveLesson(matchedTopic, grade);
        return NextResponse.json({ answer: formatAdaptiveLessonAsText(lesson) }, { status: 200 });
      }

      return NextResponse.json(
        {
          answer: `${MOCK_VEDIC_BODY}\n\nPowered by Pinnacle Software Solution | Mastery Verified.\nNeed help? WhatsApp 9535761292`,
        },
        { status: 200 },
      );
    }

    const apiKey = cleanEnv(process.env.GEMINI_API_KEY);
    const model = await resolveGeminiModel();
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_CONFIG_MISSING" }, { status: 503 });
    }

    const contents = rest.map((m) => ({
      role: m.role === "user" ? ("user" as const) : ("model" as const),
      parts: [{ text: m.content }],
    }));

    const systemText = [
      SYSTEM_INSTRUCTION_BASE,
      context ? `Learner context: ${context}` : "",
      preamble
        ? `The chat UI already displayed this assistant preamble to the learner (do not repeat it verbatim unless asked):\n${preamble}`
        : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemText }],
          },
          contents,
          generationConfig: {
            temperature: 0.45,
            maxOutputTokens: 1200,
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
      const err = describeGeminiExtractionFailure(extracted);
      return NextResponse.json(
        {
          error: err,
          finishReason: extracted.finishReason ?? null,
          blockReason: extracted.blockReason ?? null,
        },
        { status: 502 },
      );
    }

    await logDemoApiUse("api_vedic_chat", { messageCount: rest.length });
    return NextResponse.json({ answer: extracted.text }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to process tutor request";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
