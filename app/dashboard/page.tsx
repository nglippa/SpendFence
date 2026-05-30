"use client";

import Link from "next/link";
import { AlertTriangle, CalendarClock, ChevronRight, LockKeyhole, Plus, ReceiptText, ShieldCheck, WalletCards } from "lucide-react";
import { CategoryCard } from "@/components/category-card";
import { Button, EmptyState, PageHeader, Pill, ProgressBar } from "@/components/ui";
import { availableBudget, categoryProgress, currentCycleLabel, formatMoney, purchasesForCycle, remainingBudget, totalSpent } from "@/lib/budget";
import { selectDashboardInsight } from "@/lib/insights/behavioral-insights";
import { monthlyRecurringAmount, recurringFrequencyLabel, recurringKindLabel, upcomingRecurringItems } from "@/lib/recurring";
import { useSpendFence } from "@/lib/store";
import { formatShortDate } from "@/lib/utils";

export default function DashboardPage() {
  const state = useSpendFence();
  const cyclePurchases = purchasesForCycle(state.purchases, state.budgetMonth);
  const spent = totalSpent(state.purchases, state.budgetMonth);
  const available = availableBudget(state);
  const remaining = remainingBudget(state);
  const dashboardInsight = selectDashboardInsight(state);
  const upcomingRecurring = upcomingRecurringItems(state.recurringItems, 45);
  const locked = state.categories.filter((category) => categoryProgress(category, state.purchases, state.budgetMonth).status === "locked").length;
  const warnings = state.categories.filter((category) => categoryProgress(category, state.purchases, state.budgetMonth).status === "warning").length;
  const safe = state.categories.filter((category) => categoryProgress(category, state.purchases, state.budgetMonth).status === "safe").length;
  const budgetPercent = available > 0 ? (spent / available) * 100 : 0;
  const budgetColor = budgetPercent >= 100 ? "var(--app-danger)" : budgetPercent >= 80 ? "var(--app-warning)" : "var(--app-success)";

  return (
    <>
      <PageHeader
        kicker="Dashboard"
        title="Budget cycle at a glance"
        body={`${currentCycleLabel(state.budgetMonth)}. Big numbers, clear fences, and quick warnings before spending drifts.`}
        action={
          <Button asChild>
            <Link href="/add-purchase">
              <Plus size={18} /> Add purchase
            </Link>
          </Button>
        }
      />

      <div className="flow-canvas">
        <section className="grid gap-4 px-0 py-1 sm:py-2 lg:grid-cols-[1fr_1.2fr] lg:items-end">
          <div>
            <p className="section-kicker text-[var(--brand-primary)]">Remaining this cycle</p>
            <p className="mt-2 text-5xl font-black leading-none tracking-tight text-[var(--app-text)] sm:text-6xl">{formatMoney(remaining)}</p>
            <p className="mt-2 max-w-xl text-sm font-bold leading-5 text-[var(--app-text-secondary)]">Available after {formatMoney(spent)} spent from {formatMoney(available)} in planned money.</p>
          </div>
          <div className="grid gap-3">
            <div>
              <div className="mb-2 flex items-center justify-between text-xs font-black uppercase tracking-[0.14em] text-[var(--app-text-muted)]">
                <span>Budget health</span>
                <span>{Math.round(budgetPercent)}%</span>
              </div>
              <ProgressBar percent={budgetPercent} color={budgetColor} />
            </div>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              <Pill className="border-[rgb(91_169_140_/_0.22)] bg-[rgb(91_169_140_/_0.13)] text-[var(--app-success)]"><ShieldCheck size={13} className="mr-1" /> {safe} safe</Pill>
              <Pill className="border-[rgb(200_155_83_/_0.22)] bg-[rgb(200_155_83_/_0.14)] text-[var(--app-warning)]"><AlertTriangle size={13} className="mr-1" /> {warnings} warning</Pill>
              <Pill className="border-[rgb(207_113_109_/_0.22)] bg-[rgb(207_113_109_/_0.14)] text-[var(--app-danger)]"><LockKeyhole size={13} className="mr-1" /> {locked} locked</Pill>
            </div>
          </div>
        </section>

        {dashboardInsight ? (
          <div className="ml-0.5 border-l border-[rgb(139_151_220_/_0.35)] py-1 pl-3 sm:pl-4">
            <p className="text-[0.66rem] font-black uppercase tracking-[0.14em] text-[var(--app-intelligence)]">Observation</p>
            <p className="mt-1 text-sm font-black leading-5 text-[var(--app-text)] sm:text-base">{dashboardInsight.title}</p>
            <p className="mt-1 max-w-3xl text-sm font-semibold leading-5 text-[var(--app-text-secondary)]">{dashboardInsight.message}</p>
          </div>
        ) : null}

        <section className="flow-zone px-0 py-0 sm:p-5">
          <SectionHeading title="Category fences" subtitle="A quick read on where the month is calm, close, or locked." action={<Link href="/categories" className="inline-flex items-center text-xs font-black text-[var(--brand-primary)]">View all <ChevronRight size={14} /></Link>} />
          {state.categories.length ? (
            <div className="flow-list mt-3 sm:grid sm:grid-cols-2 sm:gap-2.5 lg:grid-cols-3 2xl:grid-cols-4">
              {state.categories.map((category) => (
                <Link key={category.id} href={`/categories/${category.id}`} className="block transition active:scale-[0.99] focus:outline-none focus:ring-4 focus:ring-[#58c6a8]/20">
                  <CategoryCard category={category} purchases={state.purchases} budgetMonth={state.budgetMonth} variant="compact" />
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={WalletCards}
              title="Your budget categories are ready to be shaped"
              body="Start with one or two spending areas you want to watch. SpendFence will use them to organize purchases and surface pacing alerts."
              action={
                <Button asChild size="sm">
                  <Link href="/categories">
                    <Plus size={16} /> Add category
                  </Link>
                </Button>
              }
            />
          )}
        </section>

        <section className="flow-zone px-0 py-0 sm:p-5">
          <SectionHeading title="Recurring charges" subtitle="Upcoming bills and income without another dashboard block." action={<Link href="/add-purchase" className="inline-flex items-center text-xs font-black text-[var(--brand-primary)]">Manage <ChevronRight size={14} /></Link>} />
          {upcomingRecurring.length ? (
            <div className="flow-list mt-3">
              {upcomingRecurring.slice(0, 3).map(({ item, date }) => (
                <div key={item.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                      <p className="text-sm font-black leading-5">{item.name}</p>
                      <span className={item.kind === "income" ? "shrink-0 text-[0.68rem] font-black text-emerald-700" : "shrink-0 text-[0.68rem] font-black text-slate-500"}>
                        {recurringKindLabel(item.kind)}
                      </span>
                    </div>
                    <p className="mt-0.5 flex items-center gap-1 text-[0.68rem] font-bold text-slate-500">
                      <CalendarClock size={12} /> {formatShortDate(date.toISOString())} - {recurringFrequencyLabel(item.frequency)}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className={item.kind === "income" ? "text-sm font-black text-emerald-700" : "text-sm font-black"}>
                      {item.kind === "income" ? "+" : "-"}{formatMoney(item.amount)}
                    </p>
                    <p className="text-[0.65rem] font-bold text-slate-500">{formatMoney(monthlyRecurringAmount(item))}/mo</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 border-t border-[var(--glass-hairline)] pt-3 text-xs font-bold leading-5 text-[var(--app-text-muted)]">
              Mark recurring purchases or paycheck income to see upcoming dates.
            </p>
          )}
        </section>

        <section className="flow-zone px-0 py-0 sm:p-5">
          <SectionHeading title="Recent activity" subtitle="The cycle’s latest movement, grouped as a list." />
          {cyclePurchases.length ? (
            <div className="flow-list mt-3">
              {cyclePurchases.slice(0, 6).map((purchase) => (
                <div key={purchase.id} className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <p className="text-sm font-black sm:text-base">{purchase.merchant}</p>
                    <p className="text-xs font-bold text-slate-500 sm:text-sm">{formatShortDate(purchase.date)}</p>
                  </div>
                  <p className="text-sm font-black sm:text-base">{formatMoney(purchase.amount)}</p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              compact
              icon={ReceiptText}
              title="Your first purchase this cycle will land here"
              body="When you add a purchase, it will show up here with its category and cycle date."
              action={
                <Button asChild size="sm" variant="secondary">
                  <Link href="/add-purchase">
                    <Plus size={16} /> Add purchase
                  </Link>
                </Button>
              }
            />
          )}
        </section>
      </div>
    </>
  );
}

function SectionHeading({ title, subtitle, action }: { title: string; subtitle: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-lg font-black tracking-tight text-[#10201c] sm:text-xl">{title}</h2>
        <p className="mt-1 text-xs font-bold leading-5 text-slate-500 sm:text-sm">{subtitle}</p>
      </div>
      {action ? <div className="shrink-0 pt-1">{action}</div> : null}
    </div>
  );
}
