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

export function isOnboardingDemoSeedEnabled(): boolean {
  const raw = cleanEnv(process.env.ENABLE_ONBOARDING_DEMO_SEED).toLowerCase();
  if (raw === "1" || raw === "true" || raw === "yes") return true;
  if (raw === "0" || raw === "false" || raw === "no") return false;

  // Safe default: enabled in non-production for smoother local QA, disabled in production.
  return process.env.NODE_ENV !== "production";
}
