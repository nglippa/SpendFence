"use client";

import { CategoryCard } from "@/components/category-card";
import { MonthTrendChart, RemainingByCategoryChart, SpendingByCategoryChart } from "@/components/charts";
import { Card, PageHeader, Pill } from "@/components/ui";
import { categoryProgress, formatMoney } from "@/lib/budget";
import { useSpendFence } from "@/lib/store";
import { formatShortDate } from "@/lib/utils";

export default function ReportsPage() {
  const state = useSpendFence();
  const biggest = [...state.purchases].sort((a, b) => b.amount - a.amount).slice(0, 5);
  const close = state.categories
    .map((category) => ({ category, progress: categoryProgress(category, state.purchases) }))
    .filter((item) => item.progress.status !== "safe");

  return (
    <>
      <PageHeader kicker="Reports" title="Clean monthly insights" body="Simple charts and lists that show where your money is going." />

      <div className="grid gap-4 sm:gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <h2 className="mb-3 text-lg font-black sm:mb-4 sm:text-xl">Spending by category</h2>
          <SpendingByCategoryChart categories={state.categories} purchases={state.purchases} />
        </Card>
        <Card>
          <h2 className="mb-3 text-lg font-black sm:mb-4 sm:text-xl">Month-to-date trend</h2>
          <MonthTrendChart purchases={state.purchases} />
        </Card>
      </div>

      <div className="mt-4 grid gap-4 sm:mt-5 sm:gap-5 xl:grid-cols-2">
        <Card>
          <h2 className="mb-3 text-lg font-black sm:mb-4 sm:text-xl">Remaining budget by category</h2>
          <RemainingByCategoryChart categories={state.categories} purchases={state.purchases} />
        </Card>
        <Card>
          <h2 className="mb-3 text-lg font-black sm:mb-4 sm:text-xl">Biggest purchases</h2>
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
        </Card>
      </div>

      <div className="mt-4 sm:mt-5">
        <div className="mb-3 flex items-center gap-2">
          <h2 className="text-lg font-black sm:text-xl">Categories close to limit</h2>
          <Pill className="border-amber-100 bg-amber-50 text-amber-800">{close.length} active</Pill>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {(close.length ? close.map((item) => item.category) : state.categories.slice(0, 3)).map((category) => (
            <CategoryCard key={category.id} category={category} purchases={state.purchases} />
          ))}
        </div>
      </div>
    </>
  );
}
