import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { isFounderSuperAdmin } from "@/src/lib/rbac";
import { LoginForm } from "./login-form";

type Props = {
  searchParams: Promise<{ registered?: string; mode?: string }>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const q = await searchParams;
  if (q.mode === "demo") {
    return {
      title: "Demo login · AI Academy Pro",
      description: "Enter your details and browse learning modules without full school access.",
    };
  }
  return {
    title: "Sign in · AI Academy Pro",
    description: "Mobile OTP sign-in for school staff with founder admin login toggle.",
  };
}

export default async function LoginPage({ searchParams }: Props) {
  const q = await searchParams;
  const session = await auth();

  // If already authenticated, skip login page and route by role.
  if (session?.user) {
    if (isFounderSuperAdmin(session)) {
      redirect("/admin/dashboard");
    }
    redirect("/school/dashboard");
  }

  const registered = q.registered === "1";
  const demoMode = q.mode === "demo";

  return <LoginForm registered={registered} demoMode={demoMode} />;
}
