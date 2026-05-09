import { z } from "zod";

import { cleanEnv, getGeminiModel } from "@/src/lib/env";

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
  const model = getGeminiModel();

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

  const payload = (await response.json()) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{ text?: string }>;
      };
    }>;
  };

  const rawText = payload.candidates?.[0]?.content?.parts?.[0]?.text;
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

