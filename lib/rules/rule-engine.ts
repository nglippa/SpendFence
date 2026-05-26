import { evaluateSpendingRules } from "@/lib/rules/rule-evaluator";
import { spendingRuleConditionLabels, type SpendingRule, type SpendingRuleInput } from "@/lib/rules/rule-types";
import type { BehavioralInsight, InsightGenerationOptions } from "@/lib/insights/insight-types";
import type { Category, SpendFenceState } from "@/lib/types";

export function defaultSpendingRuleInput(categoryId?: string): SpendingRuleInput {
  return {
    title: "",
    description: "",
    categoryId,
    type: "amount",
    condition: "exceeds_amount",
    thresholdAmount: 50,
    thresholdCount: 3,
    thresholdPercent: 18,
    timeWindow: "week",
    timeContext: "late_night",
    response: "warning",
    enabled: true,
    source: "manual"
  };
}

export function buildSpendingRuleCopy(input: SpendingRuleInput | SpendingRule, categories: Category[]) {
  const category = categories.find((item) => item.id === input.categoryId);
  const categoryName = category?.name ?? "Spending";
  const condition = input.condition;

  if (condition === "exceeds_amount") {
    const amount = money(input.thresholdAmount ?? 50);
    return {
      title: `${categoryName} over ${amount}`,
      description: `Warn when a single ${categoryName.toLowerCase()} purchase exceeds ${amount}.`
    };
  }

  if (condition === "happens_too_often") {
    const count = input.thresholdCount ?? 3;
    const window = input.timeWindow === "cycle" ? "cycle" : "week";
    return {
      title: `${categoryName} more than ${count}x/${window}`,
      description: `Notice when ${categoryName.toLowerCase()} happens more than ${count} times per ${window}.`
    };
  }

  if (condition === "spikes_unexpectedly") {
    return {
      title: `${categoryName} spike awareness`,
      description: `Surface a calm note when ${categoryName.toLowerCase()} rises faster than usual.`
    };
  }

  if (condition === "occurs_at_times") {
    const context = input.timeContext === "weekend" ? "weekend" : "late-night";
    return {
      title: `${categoryName} ${context} awareness`,
      description: `Notice ${context} ${categoryName.toLowerCase()} activity without judging it.`
    };
  }

  if (condition === "pace_accelerating") {
    return {
      title: `${categoryName} pace check`,
      description: `Surface a pacing alert when ${categoryName.toLowerCase()} starts moving faster than the cycle.`
    };
  }

  return {
    title: `${categoryName} early-cycle burn`,
    description: `Alert when ${categoryName.toLowerCase()} uses too much of its fence early in the cycle.`
  };
}

export function normalizeSpendingRuleInput(input: SpendingRuleInput, categories: Category[]): SpendingRuleInput {
  const copy = buildSpendingRuleCopy(input, categories);
  return {
    ...input,
    title: input.title.trim() || copy.title,
    description: input.description.trim() || copy.description,
    thresholdAmount: cleanNumber(input.thresholdAmount),
    thresholdCount: cleanNumber(input.thresholdCount),
    thresholdPercent: cleanNumber(input.thresholdPercent),
    merchantPattern: input.merchantPattern?.trim() || undefined,
    premium: input.source === "future_ai" ? true : input.premium
  };
}

export function generateSpendingRuleInsights(state: SpendFenceState, options: InsightGenerationOptions = {}): BehavioralInsight[] {
  if (!state.spendingRules?.length) return [];

  const matches = evaluateSpendingRules({
    rules: state.spendingRules,
    categories: state.categories,
    purchases: state.purchases,
    budgetMonth: state.budgetMonth,
    now: options.now
  }).filter((match) => (options.categoryId ? match.categoryId === options.categoryId : true));

  const placement = options.placement ?? "dashboard";
  const limit = placement === "reports" ? 4 : placement === "category" ? 2 : 1;

  return matches.slice(0, limit).map((match, index) => ({
    id: `spending-rule-${placement}-${match.freshnessKey}`,
    type: "spending_rule",
    title: match.title,
    message: match.message,
    supportingMetric: match.supportingMetric,
    categoryLabel: state.categories.find((category) => category.id === match.categoryId)?.name,
    confidence: "high",
    recommendedPlacement: placement,
    categoryId: match.categoryId,
    severity: match.severity,
    source: match.rule.source === "future_ai" ? "future_ai" : "local_rules",
    freshnessKey: `spending-rule-${match.freshnessKey}`,
    priorityScore: 72 - index
  }));
}

export function suggestedFutureRules(categories: Category[]) {
  const dining = categories.find((category) => /dining|eating|restaurant|food/i.test(category.name)) ?? categories[0];
  const subscriptions = categories.find((category) => /sub|membership|recurring/i.test(category.name)) ?? categories[1] ?? categories[0];
  const fun = categories.find((category) => /fun|entertain|shopping/i.test(category.name)) ?? categories[2] ?? categories[0];

  return [
    {
      title: dining ? `${dining.name} weekend pattern` : "Weekend spending pattern",
      body: "Future AI can suggest a gentle weekend awareness rule when your spending rhythm shows it."
    },
    {
      title: subscriptions ? `${subscriptions.name} increase watch` : "Subscription increase watch",
      body: "Premium rules can watch for merchant pattern changes and recurring amount drift."
    },
    {
      title: fun ? `${fun.name} adaptive threshold` : "Adaptive threshold",
      body: "Premium can adjust thresholds as your real cycle history gets clearer."
    }
  ];
}

export function conditionSummary(condition: SpendingRule["condition"]) {
  return spendingRuleConditionLabels[condition];
}

function cleanNumber(value: number | undefined) {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : undefined;
}

function money(value: number) {
  return `$${Math.round(value).toLocaleString()}`;
}
