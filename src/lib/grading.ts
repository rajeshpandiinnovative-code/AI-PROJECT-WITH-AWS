import { z } from "zod";

import { cleanEnv } from "@/src/lib/env";
import { resolveGeminiModel } from "@/src/lib/gemini-runtime-model";
import { extractGeminiGeneratedText } from "@/src/lib/gemini-response";

const gradingOutputSchema = z.object({
  marks: z.number().finite(),
  feedback: z.string().min(1),
  confidence: z.number().min(0).max(1),
  reasons: z.array(z.string()).optional(),
});

type GradeWithRubricInput = {
  extractedText: string;
  rubric: string;
  maxMarks?: number;
};

export type GradeWithRubricOutput = z.infer<typeof gradingOutputSchema>;

export async function gradeWithRubric(input: GradeWithRubricInput): Promise<GradeWithRubricOutput> {
  const apiKey = cleanEnv(process.env.GEMINI_API_KEY);
  const model = await resolveGeminiModel();

  if (!apiKey) {
    throw new Error("GEMINI_CONFIG_MISSING");
  }

  const maxMarks = input.maxMarks ?? 100;
  const prompt = [
    "You are a strict exam evaluator.",
    "Evaluate the student's answer text against the rubric.",
    `Maximum marks: ${maxMarks}.`,
    "Return only JSON with keys: marks (number), feedback (string), confidence (0 to 1), reasons (string array optional).",
    "",
    "Rubric:",
    input.rubric,
    "",
    "Student Answer Text:",
    input.extractedText,
  ].join("\n");

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: "application/json",
        },
      }),
    },
  );

  if (!response.ok) {
    throw new Error("GEMINI_REQUEST_FAILED");
  }

  const payload: unknown = await response.json();
  const { text: rawText } = extractGeminiGeneratedText(payload);
  if (!rawText) {
    throw new Error("GEMINI_EMPTY_RESPONSE");
  }

  let parsedUnknown: unknown = null;
  try {
    parsedUnknown = JSON.parse(rawText);
  } catch {
    throw new Error("GEMINI_INVALID_JSON");
  }

  const parsed = gradingOutputSchema.parse(parsedUnknown);
  const clampedMarks = Math.min(Math.max(parsed.marks, 0), maxMarks);

  return {
    ...parsed,
    marks: clampedMarks,
  };
}

