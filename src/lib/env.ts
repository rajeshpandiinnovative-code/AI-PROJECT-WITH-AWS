export function cleanEnv(value: string | undefined): string {
  if (!value) return "";
  const trimmed = value.trim();
  if (trimmed.startsWith('"') && trimmed.endsWith('"') && trimmed.length >= 2) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

export function getGeminiModel(): string {
  const configured = cleanEnv(process.env.GEMINI_MODEL);
  if (configured) return configured;
  return "gemini-2.5-flash";
}
