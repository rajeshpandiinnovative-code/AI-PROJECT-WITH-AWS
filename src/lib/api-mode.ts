/**
 * Credit-safe / offline API behaviour for Gemini & Vision.
 *
 * Set in `.env.local`:
 *   NEXT_PUBLIC_API_MODE=mock     → static syllabus-style responses (no Google billable calls)
 *   NEXT_PUBLIC_API_MODE=production | unset → real APIs (requires keys)
 */
export type PublicApiMode = "mock" | "production";

export function getPublicApiMode(): PublicApiMode {
  const raw = (process.env.NEXT_PUBLIC_API_MODE ?? "production").trim().toLowerCase();
  return raw === "mock" ? "mock" : "production";
}

export function isMockApiMode(): boolean {
  return getPublicApiMode() === "mock";
}
