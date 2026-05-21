import type { BudgetStatus, Category, Prompt, Purchase, SpendFenceState } from "@/lib/types";

export function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: value % 1 ? 2 : 0 }).format(value);
}

export function categorySpent(categoryId: string, purchases: Purchase[]) {
  return purchases.filter((purchase) => purchase.categoryId === categoryId).reduce((sum, purchase) => sum + purchase.amount, 0);
}

export function categoryProgress(category: Category, purchases: Purchase[]) {
  const spent = categorySpent(category.id, purchases);
  const percent = category.limit > 0 ? (spent / category.limit) * 100 : 0;
  const remaining = category.limit - spent;
  const status: BudgetStatus = percent >= category.hardStopThreshold ? "locked" : percent >= category.warningThreshold ? "warning" : "safe";
  return { spent, percent, remaining, status };
}

export function totalSpent(purchases: Purchase[]) {
  return purchases.reduce((sum, purchase) => sum + purchase.amount, 0);
}

export function availableBudget(state: SpendFenceState) {
  return state.budgetMonth.income - state.budgetMonth.savingsTarget;
}

export function remainingBudget(state: SpendFenceState) {
  return availableBudget(state) - totalSpent(state.purchases);
}

export function warningMessage(category: Category, purchases: Purchase[]) {
  const progress = categoryProgress(category, purchases);
  if (progress.status === "locked") {
    return `Limit reached — avoid more spending in ${category.name} this month.`;
  }
  if (progress.status === "warning") {
    return `Careful — ${category.name} is close to the monthly limit.`;
  }
  return `${category.name} is inside the fence.`;
}

export function getSmartPrompts(state: SpendFenceState): Prompt[] {
  const dynamic: Prompt[] = [];
  const day = new Date().getDate();
  state.categories.forEach((category) => {
    const progress = categoryProgress(category, state.purchases);
    if (progress.status === "warning") {
      dynamic.push({
        id: `dyn-warning-${category.id}`,
        message: `${category.name} is trending high. Lower the limit or slow spending?`,
        type: "warning"
      });
    }
    if (day <= 7 && progress.percent >= 40) {
      dynamic.push({
        id: `dyn-early-${category.id}`,
        message: `You are ${day} days into the month and already at ${Math.round(progress.percent)}% of ${category.name}.`,
        type: "trend"
      });
    }
    if (category.name === "Gas" && progress.percent < 45) {
      dynamic.push({
        id: "dyn-gas-rollover",
        message: "Want to roll unused gas money into savings?",
        type: "saving"
      });
    }
  });
  return [...dynamic, ...state.prompts].slice(0, 5);
}

export function statusCopy(status: BudgetStatus) {
  return {
    safe: "Safe",
    warning: "Warning",
    locked: "Limit reached"
  }[status];
}

export function statusClasses(status: BudgetStatus) {
  return {
    safe: "bg-emerald-50 text-emerald-700 border-emerald-100",
    warning: "bg-amber-50 text-amber-800 border-amber-100",
    locked: "bg-rose-50 text-rose-700 border-rose-100"
  }[status];
}

export function monthTrend(purchases: Purchase[]) {
  const map = new Map<string, number>();
  purchases.forEach((purchase) => {
    const day = new Date(purchase.date).getDate();
    const key = `${day}`;
    map.set(key, (map.get(key) ?? 0) + purchase.amount);
  });
  let running = 0;
  return Array.from(map.entries())
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([day, amount]) => {
      running += amount;
      return { day, spent: Math.round(running), daily: Math.round(amount) };
    });
}
