/**
 * Boards drive Stripe Price resolution together with role (see `billing-prices.ts`).
 * Directory / claim flows may store human-readable names; we normalize to env-safe suffixes.
 */

/** Presets for pricing UI and registration; prefer these over free-text where possible. */
export const BILLING_BOARD_PRESETS = [
  { key: "CBSE", label: "CBSE" },
  { key: "ICSE", label: "ICSE" },
  { key: "MATRIC", label: "State board / Matric" },
  { key: "KVS", label: "Kendriya Vidyalaya (KVS)" },
  { key: "NVS", label: "Navodaya Vidyalaya (NVS)" },
  { key: "IB", label: "IB" },
  { key: "NIOS", label: "NIOS (Open schooling)" },
  { key: "SCERT_STATE", label: "SCERT / State syllabus (generic)" },
] as const;

/** Maps directory-style names toward pricing keys when useful. */
export function normalizeBoardKey(board: string): string {
  const t = board.trim().toUpperCase();
  if (!t) {
    return "UNKNOWN";
  }
  if (t === "KVS" || t === "NVS") {
    return "CBSE";
  }
  if (t === "SCERT_STATE") {
    return "MATRIC";
  }
  if (t.includes("MATRIC") || t.includes("TN-STATE") || t === "TN") {
    return "MATRIC";
  }
  const slug = t.replace(/[^A-Z0-9]+/g, "_").replace(/^_|_$/g, "");
  return slug || "UNKNOWN";
}
