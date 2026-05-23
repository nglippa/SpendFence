import { currentCycleWindow } from "@/lib/budget";
import type { BudgetMonth, Purchase } from "@/lib/types";

const DAY_MS = 86_400_000;

export function calculateSpendingVariance(purchases: Purchase[]) {
  const values = dailyTotals(purchases);
  if (values.length < 2) return 0;
  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance = values.reduce((sum, value) => sum + (value - average) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

export function calculateCycleTiming(budgetMonth: Pick<BudgetMonth, "budgetCycleStartDay">, now = new Date()) {
  const { start, end, nextStart } = currentCycleWindow(budgetMonth, now);
  const elapsedDays = Math.max(1, Math.floor((now.getTime() - start.getTime()) / DAY_MS) + 1);
  const cycleDays = Math.max(1, Math.ceil((nextStart.getTime() - start.getTime()) / DAY_MS));
  const remainingDays = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / DAY_MS));
  return { start, end, nextStart, elapsedDays, cycleDays, remainingDays };
}

export function detectRecurringBehavior(purchases: Purchase[]) {
  const merchants = new Map<string, { merchant: string; count: number; total: number; dates: string[] }>();

  purchases.forEach((purchase) => {
    const key = purchase.merchant.trim().toLowerCase();
    const current = merchants.get(key) ?? { merchant: purchase.merchant, count: 0, total: 0, dates: [] };
    merchants.set(key, {
      merchant: current.merchant,
      count: current.count + 1,
      total: current.total + purchase.amount,
      dates: [...current.dates, purchase.date]
    });
  });

  return Array.from(merchants.entries())
    .map(([key, value]) => ({ key, ...value }))
    .filter((item) => item.count >= 2)
    .sort((a, b) => b.total - a.total);
}

export function detectTrendChanges(current: number, previous: number) {
  if (previous <= 0) return { direction: "new" as const, delta: current, percent: 0 };
  const delta = current - previous;
  return {
    direction: delta > 0 ? ("up" as const) : delta < 0 ? ("down" as const) : ("flat" as const),
    delta,
    percent: Math.round((Math.abs(delta) / previous) * 100)
  };
}

export function buildInsightPriorityScore({
  base,
  confidence,
  freshness = 0,
  warningPenalty = 0
}: {
  base: number;
  confidence: "low" | "medium" | "high";
  freshness?: number;
  warningPenalty?: number;
}) {
  const confidenceBoost = { low: 0, medium: 6, high: 12 }[confidence];
  return base + confidenceBoost + freshness - warningPenalty;
}

export function categoryTotals(purchases: Purchase[]) {
  const totals = new Map<string, number>();
  purchases.forEach((purchase) => totals.set(purchase.categoryId, (totals.get(purchase.categoryId) ?? 0) + purchase.amount));
  return totals;
}

export function totalSpend(purchases: Purchase[]) {
  return purchases.reduce((sum, purchase) => sum + purchase.amount, 0);
}

function dailyTotals(purchases: Purchase[]) {
  const totals = new Map<string, number>();
  purchases.forEach((purchase) => {
    const key = new Date(purchase.date).toISOString().slice(0, 10);
    totals.set(key, (totals.get(key) ?? 0) + purchase.amount);
  });
  return Array.from(totals.values());
}
