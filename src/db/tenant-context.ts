import type { Session } from "next-auth";

import { type TenantContext, withTenant } from "./tenant";

export function createTenantContext(session: Session | null): TenantContext {
  const schoolId = session?.user?.schoolId ?? "";

  return withTenant({ schoolId });
}
