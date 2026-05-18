import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { primaryDashboardPathForPlatformRole } from "@/src/lib/post-login-redirect";
import { showDemoEntrypoints } from "@/src/lib/show-demo";
import { LoginForm } from "./login-form";

type Props = {
  searchParams: Promise<{ registered?: string; mode?: string; email?: string; password?: string; mobile?: string; otp?: string }>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const q = await searchParams;
  if (q.mode === "demo" && showDemoEntrypoints()) {
    return {
      title: "Demo login · AI Academy Pro",
      description: "Enter your details and browse learning modules without full school access.",
    };
  }
  return {
    title: "Sign in · AI Academy Pro",
    description: "Email and password or mobile OTP for school staff and founder admin.",
  };
}

export default async function LoginPage({ searchParams }: Props) {
  const q = await searchParams;
  const session = await auth();

  // If already authenticated, skip login page and route by role.
  if (session?.user) {
    redirect(primaryDashboardPathForPlatformRole(session.user.role));
  }

  const registered = q.registered === "1";
  const demoMode = q.mode === "demo" && showDemoEntrypoints();
  /** `/login?mobile=1` / `otp=1` shows OTP first; email+password is the default (legacy `?email=1` is a no-op). */
  const preferMobileLogin = q.mobile === "1" || q.mobile === "true" || q.otp === "1" || q.otp === "true";
  const googleId =
    process.env.AUTH_GOOGLE_ID?.trim() || process.env.GOOGLE_CLIENT_ID?.trim();
  const googleSecret =
    process.env.AUTH_GOOGLE_SECRET?.trim() || process.env.GOOGLE_CLIENT_SECRET?.trim();
  const googleSignInEnabled = Boolean(googleId && googleSecret);

  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-950 text-slate-100">
          <div className="px-4 py-12 text-center text-sm text-slate-400">Loading sign-in…</div>
        </main>
      }
    >
      <LoginForm
        registered={registered}
        demoMode={demoMode}
        preferMobileLogin={preferMobileLogin}
        googleSignInEnabled={googleSignInEnabled}
      />
    </Suspense>
  );
}
