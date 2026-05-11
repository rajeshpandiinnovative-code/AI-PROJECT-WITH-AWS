import type { Session } from "next-auth";
import { redirect } from "next/navigation";
import type { ReactElement } from "react";

import { auth } from "@/auth";
import { sessionAppRole, type AppRole } from "@/src/lib/rbac";

type GuardedComponent<P> = (props: P & { session: Session }) => Promise<ReactElement> | ReactElement;

/**
 * Server-component HOC for page-level RBAC.
 * Usage: export default withRoleGuard(["SUPER_ADMIN"], async ({ session }) => <Page />);
 */
export function withRoleGuard<P extends object>(
  allowed: AppRole[],
  component: GuardedComponent<P>,
): (props: P) => Promise<ReactElement> {
  return async function Guarded(props: P): Promise<ReactElement> {
    const session = await auth();
    if (!session?.user) {
      redirect("/login");
    }
    const role = sessionAppRole(session);
    if (!allowed.includes(role)) {
      redirect("/dashboard");
    }
    return component({ ...props, session });
  };
}
