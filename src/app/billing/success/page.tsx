import Link from "next/link";

type Props = {
  searchParams: Promise<{ session_id?: string }>;
};

export default async function BillingSuccessPage({ searchParams }: Props) {
  const q = await searchParams;
  const sessionId = q.session_id;

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-16 text-center text-slate-100">
      <div className="mx-auto max-w-md rounded-2xl border border-emerald-500/30 bg-slate-900 p-8">
        <h1 className="text-2xl font-bold text-white">Payment received</h1>
        <p className="mt-3 text-sm text-slate-300">
          Thank you. Your school subscription will activate after Stripe confirms the webhook (usually within a minute).
        </p>
        {sessionId ? (
          <p className="mt-2 font-mono text-xs text-slate-500">Session: {sessionId}</p>
        ) : null}
        <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm">
          <Link href="/dashboard" className="rounded-lg bg-emerald-500 px-4 py-2 font-semibold text-slate-950">
            Open dashboard
          </Link>
          <Link href="/modules" className="text-cyan-400 underline">
            Modules
          </Link>
        </div>
      </div>
    </main>
  );
}
