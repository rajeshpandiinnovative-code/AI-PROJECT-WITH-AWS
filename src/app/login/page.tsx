import type { Metadata } from "next";

import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Sign in · AI Academy Pro",
  description: "Sign in with email and password or your school tenant UUID.",
};

type Props = {
  searchParams: Promise<{ registered?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const q = await searchParams;
  const registered = q.registered === "1";

  return <LoginForm registered={registered} />;
}
