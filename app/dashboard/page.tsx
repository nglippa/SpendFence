"use client";

import Link from "next/link";
import { AlertTriangle, LockKeyhole, Plus, ShieldCheck } from "lucide-react";
import { CategoryCard } from "@/components/category-card";
import { Button, Card, PageHeader, Pill, ProgressBar } from "@/components/ui";
import { availableBudget, categoryProgress, formatMoney, getSmartPrompts, remainingBudget, totalSpent } from "@/lib/budget";
import { useSpendFence } from "@/lib/store";
import { formatShortDate } from "@/lib/utils";

export default function DashboardPage() {
  const state = useSpendFence();
  const spent = totalSpent(state.purchases);
  const available = availableBudget(state);
  const remaining = remainingBudget(state);
  const prompts = getSmartPrompts(state);
  const locked = state.categories.filter((category) => categoryProgress(category, state.purchases).status === "locked").length;
  const warnings = state.categories.filter((category) => categoryProgress(category, state.purchases).status === "warning").length;

  return (
    <>
      <PageHeader
        kicker="Dashboard"
        title="This month at a glance"
        body="Big numbers, clear fences, and quick warnings before spending drifts."
        action={
          <Button asChild>
            <Link href="/add-purchase">
              <Plus size={18} /> Add purchase
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-[#183f36] text-white">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">Available budget</p>
          <p className="mt-3 text-4xl font-black">{formatMoney(available)}</p>
          <p className="mt-2 text-sm font-bold text-white/70">Income minus savings target</p>
        </Card>
        <Card>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Spent this month</p>
          <p className="mt-3 text-4xl font-black">{formatMoney(spent)}</p>
          <ProgressBar percent={(spent / available) * 100} color="#58c6a8" />
        </Card>
        <Card>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Remaining</p>
          <p className="mt-3 text-4xl font-black">{formatMoney(remaining)}</p>
          <div className="mt-3 flex gap-2">
            <Pill className="border-amber-100 bg-amber-50 text-amber-800"><AlertTriangle size={13} className="mr-1" /> {warnings} warning</Pill>
            <Pill className="border-rose-100 bg-rose-50 text-rose-700"><LockKeyhole size={13} className="mr-1" /> {locked} locked</Pill>
          </div>
        </Card>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_0.82fr]">
        <section className="grid gap-4 md:grid-cols-2">
          {state.categories.map((category) => (
            <CategoryCard key={category.id} category={category} purchases={state.purchases} />
          ))}
        </section>

        <section className="grid gap-5 content-start">
          <Card>
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
                <ShieldCheck size={23} />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Visual status</p>
                <h2 className="text-xl font-black">Safe / warning / limit reached</h2>
              </div>
            </div>
            <div className="mt-4 grid gap-2">
              <div className="rounded-2xl bg-emerald-50 p-3 text-sm font-black text-emerald-700">Safe means the category is comfortably inside the fence.</div>
              <div className="rounded-2xl bg-amber-50 p-3 text-sm font-black text-amber-800">Warning means a pause or lighter choice is smart.</div>
              <div className="rounded-2xl bg-rose-50 p-3 text-sm font-black text-rose-700">Limit reached means spending lock: avoid more spending this month.</div>
            </div>
          </Card>

          <Card>
            <h2 className="mb-4 text-xl font-black">Smart prompts</h2>
            <div className="grid gap-3">
              {prompts.map((prompt) => (
                <div key={prompt.id} className="rounded-2xl bg-[#f7faf7] p-3 text-sm font-bold leading-5 text-slate-700">
                  {prompt.message}
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h2 className="mb-4 text-xl font-black">Recent purchases</h2>
            <div className="grid gap-2">
              {state.purchases.slice(0, 5).map((purchase) => (
                <div key={purchase.id} className="flex items-center justify-between rounded-2xl bg-white p-3">
                  <div>
                    <p className="font-black">{purchase.merchant}</p>
                    <p className="text-sm font-bold text-slate-500">{formatShortDate(purchase.date)}</p>
                  </div>
                  <p className="font-black">{formatMoney(purchase.amount)}</p>
                </div>
              ))}
            </div>
          </Card>
        </section>
      </div>
    </>
  );
}
