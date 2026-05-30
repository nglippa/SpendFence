"use client";

import { useMemo, type ReactNode } from "react";
import Link from "next/link";
import { BarChart3, ReceiptText, TrendingUp, WalletCards } from "lucide-react";
import { MonthTrendChart, RemainingByCategoryChart, SpendingByCategoryChart } from "@/components/charts";
import { PremiumBadge } from "@/components/upgrade-modal";
import { EmptyState, PageHeader, Pill, ProgressBar } from "@/components/ui";
import { categoryProgress, currentCycleLabel, formatMoney, purchasesForCycle, statusColor, statusCopy } from "@/lib/budget";
import { selectSmartReportInsights } from "@/lib/insights/behavioral-insights";
import { useSpendFence } from "@/lib/store";
import type { Category } from "@/lib/types";
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
  const primaryInsight = smartInsights[0];
  const cycleTotal = cyclePurchases.reduce((sum, purchase) => sum + purchase.amount, 0);
  const activeCategories = new Set(cyclePurchases.map((purchase) => purchase.categoryId)).size;
  const categoriesToWatch = close.length
    ? close
    : state.categories.slice(0, 3).map((category) => ({
        category,
        progress: categoryProgress(category, state.purchases, state.budgetMonth)
      }));

  return (
    <>
      <PageHeader
        kicker="Reports"
        title="Cycle report"
        body={
          <>
            {currentCycleLabel(state.budgetMonth)}. A focused read on what changed, what stayed steady, and what may need attention. Advanced analytics and deeper analysis are included with Premium.{" "}
            <Link href="/premium" className="align-baseline transition hover:brightness-105" aria-label="Open Premium purchase page">
              <PremiumBadge />
            </Link>
          </>
        }
      />

      <div className="flow-canvas">
        <section className="report-flow-surface">
          <ReportSection eyebrow="Cycle insights" title="What this cycle is saying">
            <div className="report-metric-strip">
              <ReportMetric label="Cycle spend" value={formatMoney(cycleTotal)} />
              <ReportMetric label="Active categories" value={String(activeCategories)} />
              <ReportMetric label="Close to fence" value={String(close.length)} />
              <ReportMetric label="Purchases" value={String(cyclePurchases.length)} />
            </div>
          </ReportSection>

          {primaryInsight ? (
            <ReportSection eyebrow="Observations">
              <div className="border-l border-[rgb(139_151_220_/_0.35)] py-1 pl-3 sm:pl-4">
                <p className="text-[0.66rem] font-black uppercase tracking-[0.14em] text-[var(--app-intelligence)]">Cycle note</p>
                <p className="mt-1 text-sm font-black leading-5 text-[var(--app-text)] sm:text-base">{primaryInsight.title}</p>
                <p className="mt-1 max-w-3xl text-sm font-semibold leading-5 text-[var(--app-text-secondary)]">{primaryInsight.message}</p>
              </div>
            </ReportSection>
          ) : null}

          <ReportSection eyebrow="Summary" title="Spending by category" subtitle="Category mix and monthly shape without extra report cards.">
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
          </ReportSection>

          <ReportSection eyebrow="Category trends" title="Month-to-date trend" subtitle="Daily movement across the active cycle.">
            {cyclePurchases.length ? (
              <MonthTrendChart purchases={cyclePurchases} />
            ) : (
              <EmptyState compact icon={TrendingUp} title="Your trend line starts with the first purchase" body="A few saved purchases will turn this into a simple running view of spending over time." />
            )}
          </ReportSection>

          <ReportSection title="Remaining budget by category" subtitle="Room left across the fences you watch.">
            {state.categories.length ? (
              <RemainingByCategoryChart categories={state.categories} purchases={cyclePurchases} />
            ) : (
              <EmptyState compact icon={WalletCards} title="Add categories to unlock limit comparisons" body="Once your budget areas are set, this view will show the room left in each one." />
            )}
          </ReportSection>

          <ReportSection eyebrow="Activity" title="Biggest purchases" subtitle="A grouped list of the purchases shaping the report.">
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
          </ReportSection>

          <ReportSection
            title="Categories close to limit"
            action={<Pill className="border-amber-100 bg-amber-50 text-amber-800">{close.length} active</Pill>}
          >
            {state.categories.length ? (
              <div className="report-category-list">
                {categoriesToWatch.map(({ category, progress }) => (
                  <ReportCategoryRow key={category.id} category={category} progress={progress} />
                ))}
              </div>
            ) : (
              <EmptyState compact icon={WalletCards} title="Categories you watch will appear here" body="Add categories and limits, then SpendFence can surface the areas getting close to the fence." />
            )}
          </ReportSection>
        </section>
      </div>
    </>
  );
}

function ReportSection({
  eyebrow,
  title,
  subtitle,
  action,
  children
}: {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="report-flow-section">
      {(eyebrow || title || subtitle || action) ? (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            {eyebrow ? <p className="section-kicker text-[var(--brand-primary)]">{eyebrow}</p> : null}
            {title ? <h2 className="mt-1 text-lg font-black tracking-tight text-[var(--app-text)] sm:text-xl">{title}</h2> : null}
            {subtitle ? <p className="mt-1 text-sm font-semibold leading-5 text-[var(--app-text-muted)]">{subtitle}</p> : null}
          </div>
          {action ? <div className="shrink-0 pt-1">{action}</div> : null}
        </div>
      ) : null}
      {children}
    </div>
  );
}

function ReportCategoryRow({
  category,
  progress
}: {
  category: Category;
  progress: ReturnType<typeof categoryProgress>;
}) {
  return (
    <div className="grid gap-2.5 py-3 lg:px-1">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: category.color }} />
            <p className="truncate text-sm font-black text-[var(--app-text)] sm:text-base">{category.name}</p>
          </div>
          <p className="mt-1 text-xs font-bold text-[var(--app-text-muted)]">
            {formatMoney(progress.spent)} spent of {formatMoney(category.limit)}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-sm font-black" style={{ color: statusColor(progress.status) }}>
            {Math.round(progress.percent)}%
          </p>
          <p className="text-[0.68rem] font-black text-[var(--app-text-muted)]">{statusCopy(progress.status)}</p>
        </div>
      </div>
      <ProgressBar percent={progress.percent} color={category.color} compact />
      <p className="text-[0.68rem] font-bold text-[var(--app-text-muted)]">{formatMoney(Math.max(progress.remaining, 0))} remaining</p>
    </div>
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
