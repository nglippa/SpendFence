"use client";

import { useMemo, type ReactNode } from "react";
import Link from "next/link";
import { MonthTrendChart, RemainingByCategoryChart, SpendingByCategoryChart } from "@/components/charts";
import { PremiumBadge } from "@/components/upgrade-modal";
import { PageHeader, Pill, ProgressBar } from "@/components/ui";
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
              <ReportEmpty>Once purchases are logged against categories, this report shows where the cycle is going.</ReportEmpty>
            )}
          </ReportSection>

          <ReportSection eyebrow="Category trends" title="Month-to-date trend" subtitle="Daily movement across the active cycle.">
            {cyclePurchases.length ? (
              <MonthTrendChart purchases={cyclePurchases} />
            ) : (
              <ReportEmpty>A few saved purchases turn this into a simple running view of spending over time.</ReportEmpty>
            )}
          </ReportSection>

          <ReportSection title="Remaining budget by category" subtitle="Room left across the fences you watch.">
            {state.categories.length ? (
              <RemainingByCategoryChart categories={state.categories} purchases={cyclePurchases} />
            ) : (
              <ReportEmpty>Add categories and limits to compare the room left in each one.</ReportEmpty>
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
                        <p className="text-sm font-black text-[var(--app-text)] sm:text-base">{purchase.merchant}</p>
                        <p className="text-xs font-bold text-[var(--app-text-muted)] sm:text-sm">
                          {category?.name} - {formatShortDate(purchase.date)}
                        </p>
                      </div>
                      <p className="text-sm font-black text-[var(--app-text)] sm:text-base">{formatMoney(purchase.amount)}</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <ReportEmpty>Larger purchases in this cycle will surface here once spending is logged.</ReportEmpty>
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
              <ReportEmpty>Add categories and limits, then SpendFence surfaces the areas getting close to the fence.</ReportEmpty>
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
        <div className="mb-3.5 flex items-start justify-between gap-3">
          <div className="min-w-0">
            {eyebrow ? <p className="section-kicker text-[var(--brand-primary)]">{eyebrow}</p> : null}
            {title ? <h2 className="mt-1 text-lg font-black tracking-tight text-[var(--app-text)] sm:text-xl">{title}</h2> : null}
            {subtitle ? <p className="mt-1 text-xs font-bold leading-5 text-[var(--app-text-muted)] sm:text-sm">{subtitle}</p> : null}
          </div>
          {action ? <div className="shrink-0 pt-1">{action}</div> : null}
        </div>
      ) : null}
      {children}
    </div>
  );
}

function ReportEmpty({ children }: { children: ReactNode }) {
  return <p className="text-xs font-bold leading-5 text-[var(--app-text-muted)] sm:text-sm">{children}</p>;
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
      <p className="text-xs font-black uppercase tracking-[0.14em] text-[var(--app-text-muted)]">{label}</p>
      <p className="mt-1.5 text-xl font-black text-[var(--app-text)] sm:text-2xl">{value}</p>
    </div>
  );
}
