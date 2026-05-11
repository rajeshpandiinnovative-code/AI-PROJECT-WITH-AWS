import { eq } from "drizzle-orm";

import { appSettings } from "@/src/db/schema";
import { db } from "@/src/lib/db";
import { getGeminiModel } from "@/src/lib/env";

/** DB row key for founder “Apply globally” Gemini text model. */
export const GLOBAL_GEMINI_TEXT_MODEL_KEY = "global_gemini_text_model";

export const ALLOWED_GLOBAL_GEMINI_TEXT_MODELS = [
  "gemini-1.5-flash",
  "gemini-1.5-pro",
  "gemini-2.5-flash",
] as const;

const allowedSet = new Set<string>(ALLOWED_GLOBAL_GEMINI_TEXT_MODELS);

export function isAllowedGlobalGeminiTextModel(model: string): boolean {
  return allowedSet.has(model);
}

export async function getGlobalGeminiTextModelOverride(): Promise<string | null> {
  const [row] = await db
    .select({ value: appSettings.value })
    .from(appSettings)
    .where(eq(appSettings.key, GLOBAL_GEMINI_TEXT_MODEL_KEY))
    .limit(1);
  const v = row?.value?.trim();
  if (!v || !allowedSet.has(v)) return null;
  return v;
}

export async function setGlobalGeminiTextModel(model: string): Promise<void> {
  if (!allowedSet.has(model)) {
    throw new Error("INVALID_GLOBAL_GEMINI_MODEL");
  }
  const now = new Date();
  await db
    .insert(appSettings)
    .values({ key: GLOBAL_GEMINI_TEXT_MODEL_KEY, value: model, updatedAt: now })
    .onConflictDoUpdate({
      target: appSettings.key,
      set: { value: model, updatedAt: now },
    });
}

/** Effective text model: DB override (if set) wins, else `GEMINI_MODEL` env / default. */
export async function resolveGeminiModel(): Promise<string> {
  const override = await getGlobalGeminiTextModelOverride();
  if (override) return override;
  return getGeminiModel();
}
