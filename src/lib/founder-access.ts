import type { Session } from "next-auth";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { isFounderSuperAdmin } from "@/src/lib/rbac";

export async function requireFounder(): Promise<Session> {
  const session = await auth();
  if (!session?.user || !isFounderSuperAdmin(session)) {
    redirect("/login");
  }
  return session;
}
