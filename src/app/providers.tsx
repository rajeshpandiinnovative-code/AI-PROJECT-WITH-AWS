"use client";

import dynamic from "next/dynamic";
import { SessionProvider } from "next-auth/react";

import { AnalyticsTracker } from "@/src/components/AnalyticsTracker";
import { showDevSwitcher } from "@/src/lib/show-dev-switcher";

const DevSwitcher = showDevSwitcher()
  ? dynamic(async () => {
      const mod = await import("@/src/components/DevSwitcher");
      return { default: mod.DevSwitcher };
    })
  : null;

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AnalyticsTracker />
      {children}
      {DevSwitcher ? <DevSwitcher /> : null}
    </SessionProvider>
  );
}
