export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-[#0F172A] px-4 py-10 text-zinc-100">
      <div className="mx-auto max-w-3xl space-y-6 animate-pulse">
        <div className="h-8 w-48 rounded-lg bg-slate-700" />
        <div className="h-6 w-72 rounded-lg bg-slate-800" />
        <div className="mt-8 grid grid-cols-3 gap-3">
          <div className="h-24 rounded-xl bg-slate-800" />
          <div className="h-24 rounded-xl bg-slate-800" />
          <div className="h-24 rounded-xl bg-slate-800" />
        </div>
        <div className="h-40 rounded-xl bg-slate-800" />
      </div>
    </div>
  );
}
