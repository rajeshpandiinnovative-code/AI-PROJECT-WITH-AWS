import type { Metadata } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";

import { Providers } from "./providers";
import "./globals.css";

/* Geist from `geist` npm — font files live in node_modules (never hits fonts.googleapis.com). */

const appUrl = process.env.NEXT_PUBLIC_APP_URL;

export const metadata: Metadata = {
  title: "Pinnacle Software Solution — Evaluation SaaS India",
  description:
    "National-grade evaluation platform: UDISE+ directory, Tamil & English handwriting (Vision + Gemini), and school operations analytics for India-wide deployment.",
  ...(appUrl ? { metadataBase: new URL(appUrl) } : {}),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
