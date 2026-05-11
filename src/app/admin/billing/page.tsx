import Link from "next/link";

import { requireFounder } from "@/src/lib/founder-access";

export default async function AdminBillingPage() {
  await requireFounder();
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-white">Billing</h1>
      <p className="text-sm text-slate-400">
        Founder-level billing oversight is available in{" "}
        <Link href="/insights" className="text-cyan-300 underline">
          /insights
        </Link>{" "}
        and revenue events dashboards.
      </p>
    </div>
  );
}
