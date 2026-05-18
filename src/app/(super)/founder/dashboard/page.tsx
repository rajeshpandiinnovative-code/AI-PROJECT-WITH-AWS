import { redirect } from "next/navigation";

/** Alias URL for the founder / cross-tenant console (`/admin/dashboard`). */
export default function FounderDashboardRedirectPage() {
  redirect("/admin/dashboard");
}
