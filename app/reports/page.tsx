"use client";

import { useMemo } from "react";
import Link from "next/link";
import { BarChart3, ReceiptText, TrendingUp, WalletCards } from "lucide-react";
import { CategoryCard } from "@/components/category-card";
import { MonthTrendChart, RemainingByCategoryChart, SpendingByCategoryChart } from "@/components/charts";
import { SmartInsightsSection } from "@/components/insights/smart-insights-section";
import { PremiumBadge } from "@/components/upgrade-modal";
import { EmptyState, PageHeader, Pill } from "@/components/ui";
import { categoryProgress, currentCycleLabel, formatMoney, purchasesForCycle } from "@/lib/budget";
import { selectSmartReportInsights } from "@/lib/insights/behavioral-insights";
import { useSpendFence } from "@/lib/store";
import { formatShortDate } from "@/lib/utils";

export default function ReportsPage() {
  const state = useSpendFence();
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
            <Link href="/premium" className="align-baseline transition hover:brightness-105" aria-label="Open Premium purchase page">
              <PremiumBadge />
            </Link>
          </>
        }
      />

      <div className="flow-canvas">
        <SmartInsightsSection insights={smartInsights} />

        <section className="flow-zone snapshot-zone p-4 sm:p-5">
          <div>
            <p className="section-kicker text-[var(--brand-primary)]">Cycle summary</p>
            <div className="metric-ribbon mt-3 md:grid-cols-4">
              <ReportMetric label="Cycle spend" value={formatMoney(cycleTotal)} />
              <ReportMetric label="Active categories" value={String(activeCategories)} />
              <ReportMetric label="Close to fence" value={String(close.length)} />
              <ReportMetric label="Purchases" value={String(cyclePurchases.length)} />
            </div>
          </div>

          <div className="mt-6 border-t border-[var(--glass-hairline)] pt-5">
            <div className="mb-4">
              <h2 className="text-lg font-black sm:text-xl">Spending by category</h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">One analytics canvas for category mix and monthly shape.</p>
            </div>
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
          </div>

          <div className="mt-6 border-t border-[var(--glass-hairline)] pt-5">
            <div className="mb-4">
              <h2 className="text-lg font-black sm:text-xl">Month-to-date trend</h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">Daily movement without another framed analytics tile.</p>
            </div>
            {cyclePurchases.length ? (
              <MonthTrendChart purchases={cyclePurchases} />
            ) : (
              <EmptyState compact icon={TrendingUp} title="Your trend line starts with the first purchase" body="A few saved purchases will turn this into a simple running view of spending over time." />
            )}
          </div>

          <div className="mt-6 border-t border-[var(--glass-hairline)] pt-5">
            <div className="mb-4">
              <h2 className="text-lg font-black sm:text-xl">Remaining budget by category</h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">Room left across the fences you watch.</p>
            </div>
            {state.categories.length ? (
              <RemainingByCategoryChart categories={state.categories} purchases={cyclePurchases} />
            ) : (
              <EmptyState compact icon={WalletCards} title="Add categories to unlock limit comparisons" body="Once your budget areas are set, this view will show the room left in each one." />
            )}
          </div>

          <div className="mt-6 border-t border-[var(--glass-hairline)] pt-5">
            <div className="mb-3">
              <h2 className="text-lg font-black sm:text-xl">Biggest purchases</h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">A grouped list of the purchases shaping the report.</p>
            </div>
            {biggest.length ? (
              <div className="flow-list">
                {biggest.map((purchase) => {
                  const category = state.categories.find((item) => item.id === purchase.categoryId);
                  return (
                    <div key={purchase.id} className="flex items-center justify-between gap-3 py-3">
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
          </div>

          <div className="mt-6 border-t border-[var(--glass-hairline)] pt-5">
            <div className="mb-3 flex items-center gap-2">
              <h2 className="text-lg font-black sm:text-xl">Categories close to limit</h2>
              <Pill className="border-amber-100 bg-amber-50 text-amber-800">{close.length} active</Pill>
            </div>
            {state.categories.length ? (
              <div className="grid gap-0 md:grid-cols-2 md:gap-3 xl:grid-cols-3">
                {(close.length ? close.map((item) => item.category) : state.categories.slice(0, 3)).map((category) => (
                  <CategoryCard key={category.id} category={category} purchases={state.purchases} budgetMonth={state.budgetMonth} />
                ))}
              </div>
            ) : (
              <EmptyState compact icon={WalletCards} title="Categories you watch will appear here" body="Add categories and limits, then SpendFence can surface the areas getting close to the fence." />
            )}
          </div>
        </section>
      </div>
    </>
  );
}

function ReportMetric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-1.5 text-xl font-black text-[#10201c] sm:text-2xl">{value}</p>
    </div>
  );
}
