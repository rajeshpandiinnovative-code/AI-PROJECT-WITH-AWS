/**
 * Boards drive Stripe Price resolution together with role (see `billing-prices.ts`).
 * Directory / claim flows may store human-readable names; we normalize to env-safe suffixes.
 */

/** Presets for pricing UI and registration; users may also type a custom board string. */
export const BILLING_BOARD_PRESETS = [
  { key: "MATRIC", label: "State board / Matric (TN)" },
  { key: "CBSE", label: "CBSE" },
  { key: "ICSE", label: "ICSE" },
  { key: "IB", label: "IB" },
  { key: "NIOS", label: "NIOS" },
] as const;

/** Maps directory-style names toward pricing keys when useful. */
export function normalizeBoardKey(board: string): string {
  const t = board.trim().toUpperCase();
  if (!t) {
    return "UNKNOWN";
  }
  if (t.includes("MATRIC") || t.includes("TN-STATE") || t === "TN") {
    return "MATRIC";
  }
  const slug = t.replace(/[^A-Z0-9]+/g, "_").replace(/^_|_$/g, "");
  return slug || "UNKNOWN";
}
