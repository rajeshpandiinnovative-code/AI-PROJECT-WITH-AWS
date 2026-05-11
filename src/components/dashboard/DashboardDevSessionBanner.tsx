import type { Session } from "next-auth";

function maskUuid(id: string | undefined): string {
  if (!id) return "—";
  if (id.length <= 8) return "••••••••";
  return `${id.slice(0, 4)}…${id.slice(-4)}`;
}

function maskEmail(email: string | undefined): string {
  if (!email) return "—";
  const at = email.indexOf("@");
  if (at < 1) return "***";
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  return `${local.slice(0, 2)}***@${domain}`;
}

/**
 * Development-only: append `?debug=session` to `/dashboard` to verify tenant resolution.
 * Never renders in production.
 */
export function DashboardDevSessionBanner({
  show,
  session,
  schoolId,
  platformUserId,
  variant,
}: {
  show: boolean;
  session: Session;
  schoolId: string | undefined;
  platformUserId: string | undefined;
  variant: "platform" | "school";
}) {
  if (!show || process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <div className="border-b border-amber-500/40 bg-amber-950/80 px-4 py-2 text-xs text-amber-100">
      <p className="font-semibold text-amber-200">Dev · session debug</p>
      <p className="mt-1 font-mono text-[11px] leading-relaxed text-amber-100/90">
        variant={variant} · authSubject={session.user?.authSubject ?? "—"} · role={session.user?.role ?? "—"} · email=
        {maskEmail(session.user?.email)} · schoolId={maskUuid(schoolId)} · platformUserId={maskUuid(platformUserId)}
      </p>
    </div>
  );
}
