"use client";

import { useEffect } from "react";

/**
 * Fire-and-forget page view for the public charts route (best-effort).
 */
export function VisualizationsAnalytics() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    void fetch("/api/analytics/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventType: "page_view_visualizations",
        path: "/visualizations",
        referrer: document.referrer || undefined,
      }),
    }).catch(() => {});
  }, []);

  return null;
}
