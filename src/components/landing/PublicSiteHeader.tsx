import Link from "next/link";
import { Sparkles } from "lucide-react";

type Props = {
  /** Subtle emphasis for the page the user is on */
  activeAuth?: "demo" | "login" | "none";
};

const linkBase =
  "rounded-md px-2 py-1 text-center text-[10px] font-semibold transition sm:px-2.5 sm:text-[11px]";

export function PublicSiteHeader({ activeAuth = "none" }: Props) {
  const demoActive = activeAuth === "demo";
  const loginActive = activeAuth === "login";

  return (
    <header className="border-b border-slate-800/80 bg-slate-950/90 backdrop-blur">
      <div className="mx-auto flex h-11 max-w-6xl items-center justify-between gap-2 px-2.5 sm:gap-3 sm:px-4">
        <Link
          href="/"
          title="AI Academy Pro"
          className="inline-flex min-w-0 items-center gap-1 text-[10px] font-medium leading-none tracking-tight text-cyan-300 transition hover:text-cyan-200 sm:text-[11px]"
        >
          <Sparkles className="size-2.5 shrink-0" aria-hidden />
          <span className="truncate">AI Academy Pro</span>
        </Link>
        <nav className="flex shrink-0 items-center gap-2" aria-label="Sign in options">
          <Link
            href="/login?mode=demo"
            className={`${linkBase} ${
              demoActive
                ? "bg-cyan-500/20 text-cyan-200 ring-1 ring-cyan-400/40"
                : "bg-cyan-500 text-slate-950 hover:bg-cyan-400"
            }`}
          >
            Demo login
          </Link>
          <Link
            href="/login"
            className={`${linkBase} ${
              loginActive
                ? "border border-cyan-400/50 bg-slate-800/80 text-cyan-200"
                : "border border-slate-600 text-slate-100 hover:border-cyan-400 hover:text-cyan-200"
            }`}
          >
            Login
          </Link>
        </nav>
      </div>
    </header>
  );
}
