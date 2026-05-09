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

/** Native image generation (Nano Banana / Flash Image). Not the same as text `GEMINI_MODEL`. */
export function getGeminiImageModel(): string {
  const configured = cleanEnv(process.env.GEMINI_IMAGE_MODEL);
  if (configured) return configured;
  return "gemini-2.5-flash-image";
}

export function getAppBaseUrl(): string {
  const configured = cleanEnv(process.env.NEXT_PUBLIC_APP_URL) || cleanEnv(process.env.AUTH_URL);
  if (configured) return configured.replace(/\/$/, "");
  return "http://localhost:3000";
}

/** When false, email accounts without a linked school cannot open /dashboard (redirects to onboarding). Default: true. */
export function isPlatformDashboardWithoutSchoolAllowed(): boolean {
  const raw = cleanEnv(process.env.PLATFORM_DASHBOARD_WITHOUT_SCHOOL).toLowerCase();
  if (raw === "false" || raw === "0" || raw === "no") {
    return false;
  }
  return true;
}

export function isOnboardingDemoSeedEnabled(): boolean {
  const raw = cleanEnv(process.env.ENABLE_ONBOARDING_DEMO_SEED).toLowerCase();
  if (raw === "1" || raw === "true" || raw === "yes") return true;
  if (raw === "0" || raw === "false" || raw === "no") return false;

  // Safe default: enabled in non-production for smoother local QA, disabled in production.
  return process.env.NODE_ENV !== "production";
}
