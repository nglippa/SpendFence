"use client";

import Link from "next/link";
import { CheckCircle2, LockKeyhole, ShieldCheck } from "lucide-react";
import { Button, Card, Pill } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { PremiumBadge } from "@/components/upgrade-modal";

const freeFeatures = ["Manual purchase entry", "Receipt upload", "Budget categories", "Spending warnings", "Reports"];
const proFeatures = [
  "Everything in Free",
  "Plaid bank sync",
  "Automatic transaction imports",
  "Connected account management",
  "Transaction review queue",
  "AI categorization",
  "AI receipt understanding",
  "Advanced analytics"
];

export default function PricingPage() {
  const auth = useAuth();

  return (
    <main className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <header className="flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3">
            <img src="/icon.svg" alt="" className="h-11 w-11 rounded-2xl shadow-soft" />
            <span className="text-lg font-black text-[#10201c]">SpendFence</span>
          </Link>
          <Button asChild variant="secondary" size="sm">
            <Link href={auth.user ? "/dashboard" : "/login"}>{auth.user ? "Dashboard" : "Log in"}</Link>
          </Button>
        </header>

        <section className="py-14 text-center">
          <Pill className="border-[#cfe8de] bg-white text-[#327d6d]">
            <ShieldCheck size={13} className="mr-1" /> Calm pricing
          </Pill>
          <h1 className="mx-auto mt-5 max-w-3xl text-5xl font-black leading-tight tracking-tight text-[#10201c]">
            Manual budgeting stays free. Premium is planned.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base font-semibold leading-7 text-slate-600">
            SpendFence keeps the core budget workflow simple. Future Premium areas are marked now, but subscriptions are not enabled yet.
          </p>
        </section>

        <section className="grid gap-5 md:grid-cols-2">
          <Card className="p-6">
            <Pill className="border-slate-200 bg-white text-slate-600">Free</Pill>
            <h2 className="mt-4 text-3xl font-black text-[#10201c]">$0</h2>
            <p className="mt-2 text-sm font-semibold text-slate-600">For manual budget tracking without bank-link clutter.</p>
            <FeatureList features={freeFeatures} />
            <Button asChild size="lg" variant="secondary" className="mt-6 w-full">
              <Link href={auth.user ? "/dashboard" : "/signup"}>Start Free</Link>
            </Button>
          </Card>

          <Card className="border-[#cfe8de] p-6">
            <PremiumBadge />
            <h2 className="mt-4 text-3xl font-black text-[#10201c]">Premium</h2>
            <p className="mt-2 text-sm font-semibold text-slate-600">Planned for deeper automation and analytics when subscriptions are enabled.</p>
            <FeatureList features={proFeatures} />
            <p className="mt-3 text-xs font-bold leading-5 text-slate-500">
              No subscription checkout is active yet.
            </p>
          </Card>
        </section>

        <Card className="mt-5 bg-[#183f36] text-white">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.16em] text-[#a8ead9]">Security stance</p>
              <h2 className="mt-2 text-2xl font-black">Plaid handles secure bank connection.</h2>
              <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-white/72">
                SpendFence never asks for bank passwords, account numbers, routing numbers, card numbers, or CVV. Plaid access tokens remain server-side only.
              </p>
            </div>
            <LockKeyhole className="text-[#a8ead9]" size={42} />
          </div>
        </Card>
      </div>
    </main>
  );
}

function FeatureList({ features }: { features: string[] }) {
  return (
    <div className="mt-6 grid gap-3">
      {features.map((feature) => (
        <div key={feature} className="flex items-center gap-2 text-sm font-black text-slate-700">
          <CheckCircle2 size={17} className="text-[#58c6a8]" />
          {feature}
        </div>
      ))}
    </div>
  );
}
