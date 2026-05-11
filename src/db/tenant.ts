export type TenantContext = {
  schoolId: string;
};

export function withTenant(ctx: TenantContext): TenantContext {
  if (!ctx.schoolId || ctx.schoolId.trim().length === 0) {
    throw new Error("Tenant context is required: schoolId");
  }

  return ctx;
}
