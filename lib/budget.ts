import type { BudgetMonth, BudgetStatus, Category, Prompt, Purchase, SpendFenceState } from "@/lib/types";

export function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: value % 1 ? 2 : 0 }).format(value);
}

export function normalizeCycleStartDay(day?: number) {
  if (!Number.isFinite(day)) return 1;
  return Math.min(31, Math.max(1, Math.round(Number(day))));
}

export function currentCycleWindow(budgetMonth: Pick<BudgetMonth, "budgetCycleStartDay">, now = new Date()) {
  const day = normalizeCycleStartDay(budgetMonth.budgetCycleStartDay);
  let start = cycleDate(now.getFullYear(), now.getMonth(), day);
  if (now < start) start = cycleDate(now.getFullYear(), now.getMonth() - 1, day);
  const nextStart = cycleDate(start.getFullYear(), start.getMonth() + 1, day);
  const end = new Date(nextStart);
  end.setDate(end.getDate() - 1);
  return { start, end, nextStart };
}

export function currentCycleLabel(budgetMonth: Pick<BudgetMonth, "budgetCycleStartDay">, now = new Date()) {
  const { start, end } = currentCycleWindow(budgetMonth, now);
  const formatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });
  return `Current cycle: ${formatter.format(start)} – ${formatter.format(end)}`;
}

export function purchasesForCycle(purchases: Purchase[], budgetMonth?: Pick<BudgetMonth, "budgetCycleStartDay">, now = new Date()) {
  if (!budgetMonth) return purchases;
  const { start, nextStart } = currentCycleWindow(budgetMonth, now);
  return purchases.filter((purchase) => {
    const date = new Date(purchase.date);
    return date >= start && date < nextStart;
  });
}

export function cycleDayNumber(budgetMonth: Pick<BudgetMonth, "budgetCycleStartDay">, now = new Date()) {
  const { start } = currentCycleWindow(budgetMonth, now);
  const elapsed = now.getTime() - start.getTime();
  return Math.max(1, Math.floor(elapsed / 86_400_000) + 1);
}

export function categorySpent(categoryId: string, purchases: Purchase[], budgetMonth?: Pick<BudgetMonth, "budgetCycleStartDay">) {
  return purchasesForCycle(purchases, budgetMonth).filter((purchase) => purchase.categoryId === categoryId).reduce((sum, purchase) => sum + purchase.amount, 0);
}

export function categoryProgress(category: Category, purchases: Purchase[], budgetMonth?: Pick<BudgetMonth, "budgetCycleStartDay">) {
  const spent = categorySpent(category.id, purchases, budgetMonth);
  const percent = category.limit > 0 ? (spent / category.limit) * 100 : 0;
  const remaining = category.limit - spent;
  const status: BudgetStatus = percent >= category.hardStopThreshold ? "locked" : percent >= category.warningThreshold ? "warning" : "safe";
  return { spent, percent, remaining, status };
}

export function totalSpent(purchases: Purchase[], budgetMonth?: Pick<BudgetMonth, "budgetCycleStartDay">) {
  return purchasesForCycle(purchases, budgetMonth).reduce((sum, purchase) => sum + purchase.amount, 0);
}

export function availableBudget(state: SpendFenceState) {
  return state.budgetMonth.income - state.budgetMonth.savingsTarget;
}

export function remainingBudget(state: SpendFenceState) {
  return availableBudget(state) - totalSpent(state.purchases, state.budgetMonth);
}

export function warningMessage(category: Category, purchases: Purchase[], budgetMonth?: Pick<BudgetMonth, "budgetCycleStartDay">) {
  const progress = categoryProgress(category, purchases, budgetMonth);
  if (progress.status === "locked") {
    return `Limit reached — avoid more spending in ${category.name} this cycle.`;
  }
  if (progress.status === "warning") {
    return `Careful — ${category.name} is close to the cycle limit.`;
  }
  return `${category.name} is inside the fence.`;
}

export function getSmartPrompts(state: SpendFenceState): Prompt[] {
  const dynamic: Prompt[] = [];
  const day = cycleDayNumber(state.budgetMonth);
  state.categories.forEach((category) => {
    const progress = categoryProgress(category, state.purchases, state.budgetMonth);
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

export function statusColor(status: BudgetStatus) {
  return {
    safe: "#18B889",
    warning: "#F5B942",
    locked: "#F05D5E"
  }[status];
}

export function monthTrend(purchases: Purchase[]) {
  const map = new Map<string, { amount: number; timestamp: number }>();
  purchases.forEach((purchase) => {
    const date = new Date(purchase.date);
    const key = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date);
    const current = map.get(key);
    map.set(key, { amount: (current?.amount ?? 0) + purchase.amount, timestamp: current?.timestamp ?? date.getTime() });
  });
  let running = 0;
  return Array.from(map.entries())
    .sort((a, b) => a[1].timestamp - b[1].timestamp)
    .map(([day, { amount }]) => {
      running += amount;
      return { day, spent: Math.round(running), daily: Math.round(amount) };
    });
}

function cycleDate(year: number, monthIndex: number, requestedDay: number) {
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  return new Date(year, monthIndex, Math.min(requestedDay, lastDay));
}
