import type { Session } from "next-auth";
import { redirect } from "next/navigation";
import type { ReactElement } from "react";

import { auth } from "@/auth";
import { sessionAppRole, type AppRole } from "@/src/lib/rbac";
import { primaryDashboardPathForPlatformRole } from "@/src/lib/post-login-redirect";

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
      redirect(primaryDashboardPathForPlatformRole(session.user.role));
    }
    return component({ ...props, session });
  };
}
