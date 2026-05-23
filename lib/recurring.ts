import type { Purchase, RecurringFrequency, RecurringItem, RecurringKind } from "@/lib/types";

export type RecurringCandidate = {
  merchant: string;
  amount: number;
  categoryId: string;
  frequency: RecurringFrequency;
  kind: Exclude<RecurringKind, "income">;
  lastDate: string;
  purchaseCount: number;
  confidence: number;
};

export function monthlyRecurringAmount(item: Pick<RecurringItem, "amount" | "frequency">) {
  const multiplier: Record<RecurringFrequency, number> = {
    weekly: 52 / 12,
    biweekly: 26 / 12,
    monthly: 1,
    quarterly: 1 / 3,
    yearly: 1 / 12
  };
  return item.amount * multiplier[item.frequency];
}

export function recurringMonthlyTotals(items: RecurringItem[]) {
  return items.filter((item) => item.active).reduce(
    (totals, item) => {
      const monthly = monthlyRecurringAmount(item);
      if (item.kind === "income") totals.income += monthly;
      else totals.charges += monthly;
      totals.net = totals.income - totals.charges;
      return totals;
    },
    { charges: 0, income: 0, net: 0 }
  );
}

export function upcomingRecurringItems(items: RecurringItem[], days = 45, now = new Date()) {
  const today = startOfDay(now);
  const horizon = new Date(today);
  horizon.setDate(horizon.getDate() + days);

  return items
    .filter((item) => item.active)
    .map((item) => ({ item, date: nextUpcomingDate(item.nextDate, item.frequency, today) }))
    .filter(({ date }) => date <= horizon)
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

export function nextRecurringDate(date: string, frequency: RecurringFrequency) {
  return advanceDate(new Date(date), frequency).toISOString();
}

export function detectRecurringCandidates(purchases: Purchase[], existing: RecurringItem[] = []): RecurringCandidate[] {
  const existingNames = new Set(existing.filter((item) => item.active).map((item) => normalizeName(item.name)));
  const groups = new Map<string, Purchase[]>();

  purchases.forEach((purchase) => {
    const key = normalizeName(purchase.merchant);
    if (!key || existingNames.has(key)) return;
    groups.set(key, [...(groups.get(key) ?? []), purchase]);
  });

  return Array.from(groups.values())
    .map((group) => candidateFromGroup(group))
    .filter((candidate): candidate is RecurringCandidate => Boolean(candidate))
    .sort((a, b) => b.confidence - a.confidence || b.purchaseCount - a.purchaseCount)
    .slice(0, 5);
}

export function recurringKindLabel(kind: RecurringKind) {
  return {
    subscription: "Subscription",
    bill: "Recurring bill",
    income: "Paycheck income"
  }[kind];
}

export function recurringFrequencyLabel(frequency: RecurringFrequency) {
  return {
    weekly: "Weekly",
    biweekly: "Biweekly",
    monthly: "Monthly",
    quarterly: "Quarterly",
    yearly: "Yearly"
  }[frequency];
}

function candidateFromGroup(group: Purchase[]) {
  if (group.length < 2) return null;
  const sorted = [...group].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const intervals = sorted.slice(1).map((purchase, index) => daysBetween(sorted[index].date, purchase.date));
  const averageInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
  const frequency = inferFrequency(averageInterval);
  if (!frequency) return null;

  const amounts = sorted.map((purchase) => purchase.amount);
  const averageAmount = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;
  const maxVariance = Math.max(...amounts.map((amount) => Math.abs(amount - averageAmount)));
  if (averageAmount <= 0 || maxVariance / averageAmount > 0.2) return null;

  const latest = sorted[sorted.length - 1];
  return {
    merchant: latest.merchant,
    amount: roundMoney(averageAmount),
    categoryId: latest.categoryId,
    frequency,
    kind: inferKind(latest.merchant),
    lastDate: latest.date,
    purchaseCount: sorted.length,
    confidence: Math.min(0.96, 0.62 + sorted.length * 0.08 + Math.max(0, 0.12 - maxVariance / averageAmount))
  };
}

function inferFrequency(days: number): RecurringFrequency | null {
  if (days >= 5 && days <= 9) return "weekly";
  if (days >= 12 && days <= 17) return "biweekly";
  if (days >= 25 && days <= 35) return "monthly";
  if (days >= 80 && days <= 100) return "quarterly";
  if (days >= 350 && days <= 380) return "yearly";
  return null;
}

function inferKind(merchant: string): Exclude<RecurringKind, "income"> {
  return /netflix|hulu|spotify|apple|google|stream|prime|membership|subscription|patreon|youtube|disney/i.test(merchant)
    ? "subscription"
    : "bill";
}

function nextUpcomingDate(date: string, frequency: RecurringFrequency, today: Date) {
  let next = startOfDay(new Date(date));
  let guard = 0;
  while (next < today && guard < 400) {
    next = advanceDate(next, frequency);
    guard += 1;
  }
  return next;
}

function advanceDate(date: Date, frequency: RecurringFrequency) {
  const next = new Date(date);
  if (frequency === "weekly") next.setDate(next.getDate() + 7);
  if (frequency === "biweekly") next.setDate(next.getDate() + 14);
  if (frequency === "monthly") next.setMonth(next.getMonth() + 1);
  if (frequency === "quarterly") next.setMonth(next.getMonth() + 3);
  if (frequency === "yearly") next.setFullYear(next.getFullYear() + 1);
  return next;
}

function daysBetween(first: string, second: string) {
  return Math.round((new Date(second).getTime() - new Date(first).getTime()) / 86_400_000);
}

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function normalizeName(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ");
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}
