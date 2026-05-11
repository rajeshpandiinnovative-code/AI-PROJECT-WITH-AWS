import type { Metadata } from "next";

import { PricingPlans } from "./pricing-plans";

export const metadata: Metadata = {
  title: "Plans & billing · AI Academy Pro",
  description:
    "Board and role pricing with Stripe. When subscription enforcement is on, school tenant and individual accounts need an active trial or subscription.",
};

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-12 text-slate-100">
      <PricingPlans />
    </main>
  );
}
