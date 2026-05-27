"use client";

import { useMemo, useState } from "react";
import { BarChart3, ReceiptText, TrendingUp, WalletCards } from "lucide-react";
import { CategoryCard } from "@/components/category-card";
import { MonthTrendChart, RemainingByCategoryChart, SpendingByCategoryChart } from "@/components/charts";
import { SmartInsightsSection } from "@/components/insights/smart-insights-section";
import { PremiumBadge, UpgradeModal } from "@/components/upgrade-modal";
import { Card, EmptyState, PageHeader, Pill } from "@/components/ui";
import { categoryProgress, currentCycleLabel, formatMoney, purchasesForCycle } from "@/lib/budget";
import { selectSmartReportInsights } from "@/lib/insights/behavioral-insights";
import { useSpendFence } from "@/lib/store";
import { formatShortDate } from "@/lib/utils";

export default function ReportsPage() {
  const state = useSpendFence();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const cyclePurchases = purchasesForCycle(state.purchases, state.budgetMonth);
  const biggest = [...cyclePurchases].sort((a, b) => b.amount - a.amount).slice(0, 5);
  const close = state.categories
    .map((category) => ({ category, progress: categoryProgress(category, state.purchases, state.budgetMonth) }))
    .filter((item) => item.progress.status !== "safe");
  const smartInsights = useMemo(
    () => selectSmartReportInsights(state),
    [state.budgetMonth, state.categories, state.insightSettings, state.purchases]
  );
  const cycleTotal = cyclePurchases.reduce((sum, purchase) => sum + purchase.amount, 0);
  const activeCategories = new Set(cyclePurchases.map((purchase) => purchase.categoryId)).size;

  return (
    <>
      <PageHeader
        kicker="Reports"
        title="Clean cycle insights"
        body={
          <>
            {currentCycleLabel(state.budgetMonth)}. A focused read on what changed, what stayed steady, and what may need attention. Advanced analytics and deeper insights are included with Premium.{" "}
            <button type="button" className="align-baseline" onClick={() => setUpgradeOpen(true)} aria-label="Open Premium details">
              <PremiumBadge />
            </button>
          </>
        }
      />
      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />

      <SmartInsightsSection insights={smartInsights} />

      <section className="mb-4 grid grid-cols-2 gap-2.5 sm:mb-5 sm:gap-3 md:grid-cols-4">
        <Card className="p-3 sm:p-4">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Cycle spend</p>
          <p className="mt-1.5 text-xl font-black text-[#10201c] sm:text-2xl">{formatMoney(cycleTotal)}</p>
        </Card>
        <Card className="p-3 sm:p-4">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Active categories</p>
          <p className="mt-1.5 text-xl font-black text-[#10201c] sm:text-2xl">{activeCategories}</p>
        </Card>
        <Card className="p-3 sm:p-4">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Close to fence</p>
          <p className="mt-1.5 text-xl font-black text-[#10201c] sm:text-2xl">{close.length}</p>
        </Card>
        <Card className="p-3 sm:p-4">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Purchases</p>
          <p className="mt-1.5 text-xl font-black text-[#10201c] sm:text-2xl">{cyclePurchases.length}</p>
        </Card>
      </section>

      <div className="grid gap-4 sm:gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <h2 className="mb-3 text-lg font-black sm:mb-4 sm:text-xl">Spending by category</h2>
          {cyclePurchases.length && state.categories.length ? (
            <SpendingByCategoryChart categories={state.categories} purchases={cyclePurchases} />
          ) : (
            <EmptyState
              compact
              icon={BarChart3}
              title="Spending charts will fill in naturally"
              body="Once purchases are logged against categories, this report will show where the cycle is going."
            />
          )}
        </Card>
        <Card>
          <h2 className="mb-3 text-lg font-black sm:mb-4 sm:text-xl">Month-to-date trend</h2>
          {cyclePurchases.length ? (
            <MonthTrendChart purchases={cyclePurchases} />
          ) : (
            <EmptyState compact icon={TrendingUp} title="Your trend line starts with the first purchase" body="A few saved purchases will turn this into a simple running view of spending over time." />
          )}
        </Card>
      </div>

      <div className="mt-4 grid gap-4 sm:mt-5 sm:gap-5 xl:grid-cols-2">
        <Card>
          <h2 className="mb-3 text-lg font-black sm:mb-4 sm:text-xl">Remaining budget by category</h2>
          {state.categories.length ? (
            <RemainingByCategoryChart categories={state.categories} purchases={cyclePurchases} />
          ) : (
            <EmptyState compact icon={WalletCards} title="Add categories to unlock limit comparisons" body="Once your budget areas are set, this view will show the room left in each one." />
          )}
        </Card>
        <Card>
          <h2 className="mb-3 text-lg font-black sm:mb-4 sm:text-xl">Biggest purchases</h2>
          {biggest.length ? (
            <div className="grid gap-2.5 sm:gap-3">
              {biggest.map((purchase) => {
                const category = state.categories.find((item) => item.id === purchase.categoryId);
                return (
                  <div key={purchase.id} className="flex items-center justify-between gap-3 rounded-xl bg-[#f7faf7] p-3 sm:rounded-3xl sm:p-4">
                    <div>
                      <p className="text-sm font-black sm:text-base">{purchase.merchant}</p>
                      <p className="text-xs font-bold text-slate-500 sm:text-sm">
                        {category?.name} - {formatShortDate(purchase.date)}
                      </p>
                    </div>
                    <p className="text-sm font-black sm:text-base">{formatMoney(purchase.amount)}</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState compact icon={ReceiptText} title="Bigger purchases will surface here" body="This list will highlight the larger purchases in the current cycle once spending is logged." />
          )}
        </Card>
      </div>

      <div className="mt-4 sm:mt-5">
        <div className="mb-3 flex items-center gap-2">
          <h2 className="text-lg font-black sm:text-xl">Categories close to limit</h2>
          <Pill className="border-amber-100 bg-amber-50 text-amber-800">{close.length} active</Pill>
        </div>
        {state.categories.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {(close.length ? close.map((item) => item.category) : state.categories.slice(0, 3)).map((category) => (
              <CategoryCard key={category.id} category={category} purchases={state.purchases} budgetMonth={state.budgetMonth} />
            ))}
          </div>
        ) : (
          <Card>
            <EmptyState compact icon={WalletCards} title="Categories you watch will appear here" body="Add categories and limits, then SpendFence can surface the areas getting close to the fence." />
          </Card>
        )}
      </div>
    </>
  );
}
