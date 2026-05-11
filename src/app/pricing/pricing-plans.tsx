"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useState } from "react";

import { BILLING_BOARD_PRESETS } from "@/src/lib/board-billing";

import { CheckoutButton, type CheckoutScope } from "./checkout-button";

const ROLE_PLANS: { scope: Exclude<CheckoutScope, "school">; title: string }[] = [
  { scope: "student", title: "Student" },
  { scope: "parent", title: "Parent" },
  { scope: "teacher", title: "Teacher" },
  { scope: "admin", title: "School admin (staff)" },
  { scope: "management", title: "Management" },
  { scope: "school_org", title: "Founder / institution (billing owner)" },
];

const PRESET_KEYS = new Set<string>(BILLING_BOARD_PRESETS.map((b) => b.key));

export function PricingPlans() {
  const { data: session, status } = useSession();
  const sessionBoard = session?.user?.board?.trim();
  const mountKey =
    status === "loading" ? "loading" : `${status}:${sessionBoard ?? "noboard"}`;

  return <PricingPlansInner key={mountKey} sessionBoard={sessionBoard} />;
}

function PricingPlansInner({ sessionBoard }: { sessionBoard?: string }) {
  const [boardSelect, setBoardSelect] = useState(() => {
    if (sessionBoard && PRESET_KEYS.has(sessionBoard)) {
      return sessionBoard;
    }
    if (sessionBoard && !PRESET_KEYS.has(sessionBoard)) {
      return "__custom__";
    }
    return BILLING_BOARD_PRESETS[0]?.key ?? "MATRIC";
  });
  const [customBoard, setCustomBoard] = useState(() =>
    sessionBoard && !PRESET_KEYS.has(sessionBoard) ? sessionBoard : "",
  );

  const resolvedBoard =
    boardSelect === "__custom__"
      ? customBoard.trim() || sessionBoard || BILLING_BOARD_PRESETS[0]?.key || "MATRIC"
      : boardSelect.trim() || sessionBoard || BILLING_BOARD_PRESETS[0]?.key || "MATRIC";

  return (
    <div className="mx-auto max-w-2xl space-y-10">
      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-8">
        <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">AI Academy Pro</p>
        <h1 className="mt-3 text-3xl font-bold text-white">Plans &amp; billing</h1>
        <p className="mt-4 text-sm text-slate-300">
          Prices are resolved by <strong className="font-medium text-slate-200">curriculum board</strong> and{" "}
          <strong className="font-medium text-slate-200">role</strong>. Configure Stripe Price IDs such as{" "}
          <code className="text-cyan-400">STRIPE_PRICE_STUDENT_MATRIC</code> and{" "}
          <code className="text-cyan-400">STRIPE_PRICE_SCHOOL_CBSE</code> (see{" "}
          <code className="text-cyan-400">billing-prices.ts</code>). When{" "}
          <code className="text-cyan-400">REQUIRE_PAID_SUBSCRIPTION=true</code>, APIs and the dashboard check subscription
          status: <strong className="font-medium text-slate-200">School ID sign-in</strong> uses your school tenant&apos;s
          subscription; <strong className="font-medium text-slate-200">email sign-in</strong> uses that platform
          user&apos;s subscription (independent of school billing). Without access you may be redirected here from{" "}
          <code className="text-cyan-400">/dashboard</code>.
        </p>
        <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
          <label htmlFor="pricing-board" className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Board for individual plans
          </label>
          <p className="mt-1 text-xs text-slate-500">
            Used when you subscribe as a student, parent, teacher, etc. School (tenant) checkout uses the board stored on your school
            from UDISE claim.
          </p>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
            <select
              id="pricing-board"
              value={boardSelect}
              onChange={(e) => setBoardSelect(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500 sm:max-w-xs"
            >
              {BILLING_BOARD_PRESETS.map((b) => (
                <option key={b.key} value={b.key}>
                  {b.label}
                </option>
              ))}
              <option value="__custom__">Other (type below)</option>
            </select>
            {boardSelect === "__custom__" ? (
              <input
                type="text"
                placeholder="e.g. TN-MATRIC, State board"
                value={customBoard}
                onChange={(e) => setCustomBoard(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
              />
            ) : null}
          </div>
          {sessionBoard ? (
            <p className="mt-2 text-xs text-slate-500">
              Signed-in account board: <span className="text-slate-300">{sessionBoard}</span>
            </p>
          ) : null}
        </div>

        <ul className="mt-6 list-inside list-disc space-y-1 text-sm text-slate-400">
          <li>School plan: priced from your tenant&apos;s board field (from directory / claim).</li>
          <li>Individual plans: same role can pick different boards; each maps to its own Stripe price when configured.</li>
        </ul>

        <h2 className="mt-8 text-lg font-semibold text-white">School (tenant)</h2>
        <p className="mt-2 text-sm text-slate-400">
          Sign in with your School ID. Checkout uses <code className="text-cyan-400">STRIPE_PRICE_SCHOOL_&lt;BOARD&gt;</code> from your
          school record.
        </p>
        <CheckoutButton scope="school" label="Subscribe school (tenant)" board={resolvedBoard} />
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-8">
        <h2 className="text-lg font-semibold text-white">Individual roles</h2>
        <p className="mt-2 text-sm text-slate-400">
          Register with email, pick your role, choose board above, then checkout. Role + board selects the Stripe price.
        </p>
        <ul className="mt-6 divide-y divide-slate-800 border border-slate-800 rounded-xl overflow-hidden">
          {ROLE_PLANS.map(({ scope, title }) => (
            <li key={scope} className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/80 px-4 py-4">
              <span className="font-medium text-slate-200">{title}</span>
              <CheckoutButton
                scope={scope}
                label={`Choose ${title} plan`}
                board={resolvedBoard}
                compact
                showHint={false}
              />
            </li>
          ))}
        </ul>
      </section>

      <div className="flex flex-wrap gap-3 text-sm px-2">
        <Link href="/register" className="text-cyan-400 underline">
          Create account
        </Link>
        <Link href="/login" className="text-cyan-400 underline">
          Sign in (email or school)
        </Link>
        <Link href="/onboarding" className="text-cyan-400 underline">
          Claim school
        </Link>
        <Link href="/" className="text-slate-500 underline">
          Home
        </Link>
      </div>
    </div>
  );
}
