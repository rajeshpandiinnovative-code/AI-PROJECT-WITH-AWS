"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * Sends anonymous page_view events for landing and SPA navigations.
 */
export function AnalyticsTracker() {
  const pathname = usePathname();
  const previousPath = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || previousPath.current === pathname) {
      return;
    }
    previousPath.current = pathname;

    void fetch("/api/analytics/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventType: "page_view",
        path: pathname,
        referrer: typeof document !== "undefined" ? document.referrer || undefined : undefined,
      }),
    }).catch(() => {});
  }, [pathname]);

  return null;
}
