import { categoryProgress, currentCycleWindow, formatMoney, purchasesForCycle } from "@/lib/budget";
import type { BudgetMonth, Category, Purchase } from "@/lib/types";
import type { SpendingRule, SpendingRuleMatch } from "@/lib/rules/rule-types";

export type SpendingRuleEvaluationInput = {
  rules: SpendingRule[];
  categories: Category[];
  purchases: Purchase[];
  budgetMonth: BudgetMonth;
  now?: Date;
};

export function evaluateSpendingRules(input: SpendingRuleEvaluationInput): SpendingRuleMatch[] {
  const now = input.now ?? new Date();
  const cyclePurchases = purchasesForCycle(input.purchases, input.budgetMonth, now);
  const previousPurchases = previousCyclePurchases(input.purchases, input.budgetMonth, now);

  return input.rules
    .filter((rule) => rule.enabled)
    .flatMap((rule) => evaluateRule(rule, input.categories, cyclePurchases, previousPurchases, input.budgetMonth, now))
    .sort((a, b) => severityScore(b.severity) - severityScore(a.severity));
}

function evaluateRule(
  rule: SpendingRule,
  categories: Category[],
  cyclePurchases: Purchase[],
  previousPurchases: Purchase[],
  budgetMonth: BudgetMonth,
  now: Date
): SpendingRuleMatch[] {
  const scopedPurchases = filterRulePurchases(rule, cyclePurchases);
  const category = categories.find((item) => item.id === rule.categoryId);
  const categoryName = category?.name ?? "spending";

  if (rule.condition === "exceeds_amount") {
    const threshold = validNumber(rule.thresholdAmount, 50);
    const purchase = scopedPurchases
      .filter((item) => item.amount > threshold)
      .sort((a, b) => b.amount - a.amount)[0];
    if (!purchase) return [];
    return [
      {
        rule,
        categoryId: purchase.categoryId,
        purchaseId: purchase.id,
        title: rule.title || `${categoryName} over ${formatMoney(threshold)}`,
        message: `${categoryName} spending exceeded your preferred ${formatMoney(threshold)} threshold at ${purchase.merchant}.`,
        supportingMetric: formatMoney(purchase.amount),
        severity: responseSeverity(rule),
        freshnessKey: `${rule.id}-${purchase.id}`
      }
    ];
  }

  if (rule.condition === "happens_too_often") {
    const threshold = Math.max(1, Math.round(validNumber(rule.thresholdCount, 3)));
    const recentPurchases = filterRecent(scopedPurchases, rule.timeWindow === "cycle" ? cycleStart(budgetMonth, now) : daysBefore(now, 7));
    if (recentPurchases.length <= threshold) return [];
    return [
      {
        rule,
        categoryId: rule.categoryId,
        title: rule.title || `${categoryName} frequency`,
        message: `${categoryName} happened ${recentPurchases.length} times ${rule.timeWindow === "cycle" ? "this cycle" : "this week"}, above your preferred rhythm of ${threshold}.`,
        supportingMetric: `${recentPurchases.length} purchases`,
        severity: responseSeverity(rule),
        freshnessKey: `${rule.id}-${recentPurchases.length}-${recentPurchases[0]?.id ?? "current"}`
      }
    ];
  }

  if (rule.condition === "spikes_unexpectedly") {
    if (!rule.categoryId) return [];
    const current = total(scopedPurchases);
    const previous = total(previousPurchases.filter((purchase) => purchase.categoryId === rule.categoryId));
    const threshold = validNumber(rule.thresholdPercent, 25);
    if (previous <= 0 || current < previous * (1 + threshold / 100)) return [];
    return [
      {
        rule,
        categoryId: rule.categoryId,
        title: rule.title || `${categoryName} spike`,
        message: `${categoryName} is running higher than the previous cycle. This is a check-in, not a judgment.`,
        supportingMetric: `${Math.round(((current - previous) / previous) * 100)}% higher`,
        severity: responseSeverity(rule),
        freshnessKey: `${rule.id}-${Math.round(current)}-${Math.round(previous)}`
      }
    ];
  }

  if (rule.condition === "occurs_at_times") {
    const threshold = Math.max(1, Math.round(validNumber(rule.thresholdCount, 1)));
    const matched = scopedPurchases.filter((purchase) => matchesTimeContext(purchase, rule.timeContext));
    if (matched.length < threshold) return [];
    const contextLabel = rule.timeContext === "weekend" ? "weekend" : "late-night";
    return [
      {
        rule,
        categoryId: rule.categoryId,
        purchaseId: matched[0]?.id,
        title: rule.title || `${categoryName} ${contextLabel} pattern`,
        message: `${categoryName} had ${contextLabel} activity that matched your personal awareness rule.`,
        supportingMetric: `${matched.length} ${matched.length === 1 ? "purchase" : "purchases"}`,
        severity: responseSeverity(rule),
        freshnessKey: `${rule.id}-${matched.length}-${matched[0]?.id ?? "time"}`
      }
    ];
  }

  if (rule.condition === "pace_accelerating" || rule.condition === "burns_too_quickly") {
    if (!category) return [];
    const progress = categoryProgress(category, cyclePurchases, budgetMonth);
    const expectedPercent = cycleElapsedRatio(budgetMonth, now) * 100;
    const buffer = validNumber(rule.thresholdPercent, rule.condition === "burns_too_quickly" ? 12 : 18);
    if (progress.percent <= expectedPercent + buffer || progress.percent < 15) return [];
    return [
      {
        rule,
        categoryId: category.id,
        title: rule.title || `${category.name} pace`,
        message: `${category.name} is moving faster than your preferred cycle pace.`,
        supportingMetric: `${Math.round(progress.percent)}% used`,
        severity: rule.response === "subtle_insight" ? "calm" : "watch",
        freshnessKey: `${rule.id}-${Math.round(progress.percent)}-${Math.round(expectedPercent)}`
      }
    ];
  }

  return [];
}

function filterRulePurchases(rule: SpendingRule, purchases: Purchase[]) {
  const merchantPattern = rule.merchantPattern?.trim().toLowerCase();
  return purchases.filter((purchase) => {
    if (rule.categoryId && purchase.categoryId !== rule.categoryId) return false;
    if (merchantPattern && !purchase.merchant.toLowerCase().includes(merchantPattern)) return false;
    return true;
  });
}

function previousCyclePurchases(purchases: Purchase[], budgetMonth: BudgetMonth, now: Date) {
  const { start } = currentCycleWindow(budgetMonth, now);
  const previousStart = addMonths(start, -1);
  return purchases.filter((purchase) => {
    const date = new Date(purchase.date);
    return date >= previousStart && date < start;
  });
}

function cycleStart(budgetMonth: BudgetMonth, now: Date) {
  return currentCycleWindow(budgetMonth, now).start;
}

function cycleElapsedRatio(budgetMonth: BudgetMonth, now: Date) {
  const { start, nextStart } = currentCycleWindow(budgetMonth, now);
  return Math.min(Math.max((now.getTime() - start.getTime()) / (nextStart.getTime() - start.getTime()), 0), 1);
}

function filterRecent(purchases: Purchase[], after: Date) {
  return purchases.filter((purchase) => new Date(purchase.date) >= after);
}

function daysBefore(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() - days);
  return next;
}

function matchesTimeContext(purchase: Purchase, context: SpendingRule["timeContext"]) {
  const date = new Date(purchase.date);
  if (context === "weekend") return date.getDay() === 0 || date.getDay() === 6;
  const hour = date.getHours();
  return hour >= 22 || hour < 5;
}

function responseSeverity(rule: SpendingRule): SpendingRuleMatch["severity"] {
  if (rule.response === "subtle_insight") return "calm";
  return "watch";
}

function validNumber(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : fallback;
}

function total(purchases: Purchase[]) {
  return purchases.reduce((sum, purchase) => sum + Math.abs(Number(purchase.amount) || 0), 0);
}

function addMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

function severityScore(severity: SpendingRuleMatch["severity"]) {
  return { limit: 3, watch: 2, calm: 1 }[severity];
}
