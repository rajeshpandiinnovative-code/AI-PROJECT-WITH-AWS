import Link from "next/link";

import { requireFounder } from "@/src/lib/founder-access";

export default async function AdminAnalyticsPage() {
  await requireFounder();
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-white">AI Analytics</h1>
      <p className="text-sm text-slate-400">
        Use the command center charts on <Link href="/admin/dashboard" className="text-cyan-300 underline">Dashboard</Link>{" "}
        for OCR throughput and token usage/cost views.
      </p>
    </div>
  );
}
