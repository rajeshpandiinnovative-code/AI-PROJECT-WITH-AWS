/**
 * Dev Switcher UI (role/tenant quick-switch) — opt-in so it stays hidden in local dev by default.
 * Set `NEXT_PUBLIC_SHOW_DEV_SWITCHER=true` in `.env.local` and restart the dev server to show it.
 * Requires `NODE_ENV === "development"` (never bundled for production clients).
 */
export function showDevSwitcher(): boolean {
  return (
    process.env.NODE_ENV === "development" &&
    process.env.NEXT_PUBLIC_SHOW_DEV_SWITCHER === "true"
  );
}
