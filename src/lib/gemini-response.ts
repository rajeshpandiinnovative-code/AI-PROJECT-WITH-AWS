/**
 * Normalizes Gemini `generateContent` JSON: joins all text parts and surfaces block/finish metadata.
 * https://ai.google.dev/api/rest/v1beta/GenerateContentResponse
 */
export type GeminiExtractResult = {
  text: string;
  blockReason?: string;
  finishReason?: string;
};

export function extractGeminiGeneratedText(payload: unknown): GeminiExtractResult {
  if (!payload || typeof payload !== "object") {
    return { text: "" };
  }

  const root = payload as Record<string, unknown>;
  const promptFeedback = root.promptFeedback as { blockReason?: string } | undefined;
  const candidates = root.candidates as
    | Array<{
        finishReason?: string;
        content?: { parts?: Array<{ text?: string }> };
      }>
    | undefined;

  const blockReason = promptFeedback?.blockReason;
  const first = candidates?.[0];
  const finishReason = first?.finishReason;
  const parts = first?.content?.parts;

  let text = "";
  if (Array.isArray(parts)) {
    for (const part of parts) {
      if (part && typeof part === "object" && typeof part.text === "string") {
        text += part.text;
      }
    }
  }

  return { text: text.trim(), blockReason, finishReason };
}

/** Image binary returned by Gemini / Imagen-style models (`inlineData` in REST JSON). */
export type GeminiInlineImage = {
  mimeType: string;
  /** Raw base64 from API (not a data URL). */
  dataBase64: string;
};

function readInlineImagePart(part: unknown): GeminiInlineImage | null {
  if (!part || typeof part !== "object") {
    return null;
  }
  const p = part as Record<string, unknown>;
  const inline =
    (p.inlineData as Record<string, unknown> | undefined) ??
    (p.inline_data as Record<string, unknown> | undefined);
  if (!inline || typeof inline !== "object") {
    return null;
  }
  const mimeRaw = inline.mimeType ?? inline.mime_type;
  const dataRaw = inline.data;
  if (typeof mimeRaw !== "string" || typeof dataRaw !== "string" || !dataRaw) {
    return null;
  }
  return { mimeType: mimeRaw, dataBase64: dataRaw };
}

/**
 * Collects inline images from `generateContent` response candidates.
 * Text-only models omit these; image models attach `inlineData` parts.
 */
export function extractGeminiInlineImages(payload: unknown): GeminiInlineImage[] {
  if (!payload || typeof payload !== "object") {
    return [];
  }
  const root = payload as Record<string, unknown>;
  const candidates = root.candidates as unknown[] | undefined;
  const first = candidates?.[0] as Record<string, unknown> | undefined;
  const content = first?.content as Record<string, unknown> | undefined;
  const parts = content?.parts as unknown[] | undefined;
  if (!Array.isArray(parts)) {
    return [];
  }
  const out: GeminiInlineImage[] = [];
  for (const part of parts) {
    const img = readInlineImagePart(part);
    if (img) {
      out.push(img);
    }
  }
  return out;
}

export function describeGeminiExtractionFailure(result: GeminiExtractResult): string {
  if (result.blockReason) {
    return `GEMINI_BLOCKED:${result.blockReason}`;
  }
  if (result.finishReason && result.finishReason !== "STOP" && result.finishReason !== "MAX_TOKENS") {
    return `GEMINI_FINISH:${result.finishReason}`;
  }
  return "GEMINI_EMPTY_RESPONSE";
}
