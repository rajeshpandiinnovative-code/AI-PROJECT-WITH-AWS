/**
 * Demo entry points (`/login?mode=demo`, header Register when enabled, etc.) only when enabled.
 * Set `SHOW_DEMO=true` (server) and/or `NEXT_PUBLIC_SHOW_DEMO=true` (client / shared UI).
 */
export function showDemoEntrypoints(): boolean {
  return (
    process.env.SHOW_DEMO === "true" || process.env.NEXT_PUBLIC_SHOW_DEMO === "true"
  );
}
