import { currentCycleWindow } from "@/lib/budget";
import { filterLearnedSuggestions, learningScoreForSuggestion } from "@/lib/ai/fence-learning";
import { evaluateSpendingRules } from "@/lib/rules/rule-evaluator";
import type { SpendingRule } from "@/lib/rules/rule-types";
import type { AdaptiveFenceSettings, AdaptiveFenceSuggestion, AdaptiveFenceSuggestionEvidence, BudgetMonth, Category, FenceLearningEvent, Purchase, RecurringItem } from "@/lib/types";

export type AdaptiveFenceInput = {
  categories: Category[];
  purchases: Purchase[];
  recurringItems?: RecurringItem[];
  spendingRules?: SpendingRule[];
  budgetMonth: BudgetMonth;
  settings?: AdaptiveFenceSettings;
  learningEvents?: FenceLearningEvent[];
  now?: string;
};

const DEFAULT_SETTINGS: AdaptiveFenceSettings = {
  enabled: true,
  frequency: "balanced",
  automationLevel: "require-confirmation",
  learningSensitivity: "moderate"
};

const SAFE_USAGE_PERCENT = 40;
const TIGHT_USAGE_PERCENT = 90;
const TIGHT_LANGUAGE_FLOOR = 85;
const MIN_PACING_ELAPSED_RATIO = 0.2;
const MIN_PACING_USAGE_PERCENT = 50;
const PROJECTED_OVERAGE_MULTIPLIER = 1.08;

type EvidenceReasonCode = "likely_over_limit" | "current_tight" | "recent_overages" | "ahead_of_pace" | "consistent_underuse" | "recurring_base" | "weekend_cluster" | "personal_rule_pacing";

type SuggestionCandidate = AdaptiveFenceSuggestion & {
  priority: number;
};

export function generateLocalFenceSuggestions(input: AdaptiveFenceInput): AdaptiveFenceSuggestion[] {
  const settings = { ...DEFAULT_SETTINGS, ...input.settings };
  if (!settings.enabled || !input.categories.length) return [];

  const now = input.now ? new Date(input.now) : new Date();
  const learningEvents = input.learningEvents ?? [];
  const suggestions: SuggestionCandidate[] = [
    ...input.categories.flatMap((category) => suggestionsForCategory(category, input, settings, now)),
    ...suggestionsFromSpendingRules(input, now)
  ];
  const learned = filterLearnedSuggestions(suggestions, learningEvents, now);

  return learned
    .sort((a, b) => suggestionRank(b, learningEvents) - suggestionRank(a, learningEvents))
    .slice(0, suggestionLimit(settings.frequency))
    .map(({ priority: _priority, ...suggestion }) => suggestion);
}

function suggestionsFromSpendingRules(input: AdaptiveFenceInput, now: Date): SuggestionCandidate[] {
  if (!input.spendingRules?.length) return [];

  return evaluateSpendingRules({
    rules: input.spendingRules.filter((rule) => rule.condition === "pace_accelerating" || rule.condition === "burns_too_quickly"),
    categories: input.categories,
    purchases: input.purchases,
    budgetMonth: input.budgetMonth,
    now
  })
    .map((match) => {
      const category = input.categories.find((item) => item.id === match.categoryId);
      if (!category) return null;
      const current = categoryCycleProgress(category, input, now);
      const cyclePace = currentCyclePacing(input.budgetMonth, now);
      const evidence = buildEvidence(category, current, cyclePace, "personal_rule_pacing");
      if (!isMeaningfulPacingEvidence(evidence)) return null;
      return {
        id: `adaptive-rule-${match.rule.id}`,
        categoryId: category.id,
        type: "pacing",
        title: `${category.name} personal rule matched`,
        explanation: `${category.name} is at ${Math.round(evidence.usagePercent)}% while the cycle is ${Math.round(evidence.cycleProgressPercent)}% complete, matching your personal pacing rule.`,
        suggestedAction: "Review personal rule",
        confidence: "medium",
        currentLimit: category.limit,
        metric: match.supportingMetric,
        evidence,
        priority: 72,
        source: "local_rules"
      } satisfies SuggestionCandidate;
    })
    .filter(Boolean) as SuggestionCandidate[];
}

export function normalizeAdaptiveSuggestions(suggestions: Partial<AdaptiveFenceSuggestion>[], fallback: AdaptiveFenceSuggestion[], categories: Category[]) {
  const categoryIds = new Set(categories.map((category) => category.id));
  const normalized = suggestions
    .map((suggestion, index) => {
      const fallbackSuggestion = fallback[index];
      const categoryId = typeof suggestion.categoryId === "string" && categoryIds.has(suggestion.categoryId) ? suggestion.categoryId : fallbackSuggestion?.categoryId;
      const category = categories.find((item) => item.id === categoryId);
      if (!category || !categoryId) return null;
      const type = isSuggestionType(suggestion.type) ? suggestion.type : fallbackSuggestion?.type ?? "pacing";
      const confidence = suggestion.confidence === "high" || suggestion.confidence === "medium" || suggestion.confidence === "low" ? suggestion.confidence : fallbackSuggestion?.confidence ?? "medium";
      const suggestedLimit = validLimit(suggestion.suggestedLimit) ? roundToFive(Number(suggestion.suggestedLimit)) : fallbackSuggestion?.suggestedLimit;
      const evidence = fallbackSuggestion?.evidence;
      if (!evidence) return null;

      return {
        id: fallbackSuggestion?.id ?? stableId(categoryId, type),
        categoryId,
        type,
        title: safeGroundedText(suggestion.title, fallbackSuggestion?.title ?? `${category.name} fence note`, 56),
        explanation: safeGroundedText(suggestion.explanation, fallbackSuggestion?.explanation ?? "SpendFence found a small pattern worth reviewing.", 150),
        suggestedAction: safeText(
          suggestion.suggestedAction,
          suggestedLimit ? `Adjust to ${formatMoney(suggestedLimit)}` : fallbackSuggestion?.suggestedAction ?? "Review fence",
          54
        ),
        confidence,
        currentLimit: category.limit,
        suggestedLimit,
        estimatedMonthlyImpact: validLimit(suggestion.estimatedMonthlyImpact) ? Number(suggestion.estimatedMonthlyImpact) : fallbackSuggestion?.estimatedMonthlyImpact,
        metric: safeOptionalText(suggestion.metric, fallbackSuggestion?.metric, 44),
        evidence,
        source: suggestion.source === "groq" ? "groq" : fallbackSuggestion?.source ?? "local_rules"
      } satisfies AdaptiveFenceSuggestion;
    })
    .filter(Boolean) as AdaptiveFenceSuggestion[];

  return normalized.length ? normalized : fallback;
}

function suggestionsForCategory(category: Category, input: AdaptiveFenceInput, settings: AdaptiveFenceSettings, now: Date): SuggestionCandidate[] {
  if (category.limit <= 0) return [];

  const current = categoryCycleProgress(category, input, now);
  const cycles = previousCycleTotals(category.id, input.purchases, input.budgetMonth, now, 4);
  const completedCycles = cycles.filter((cycle) => cycle.completed);
  const averageCompleted = average(completedCycles.map((cycle) => cycle.total));
  const volatility = standardDeviation(completedCycles.map((cycle) => cycle.total));
  const recurringTotal = (input.recurringItems ?? [])
    .filter((item) => item.active && item.categoryId === category.id && (item.kind === "bill" || item.kind === "subscription"))
    .reduce((sum, item) => sum + normalizedMonthlyRecurringAmount(item), 0);
  const weekendShare = categoryWeekendShare(category.id, input.purchases);
  const cyclePace = currentCyclePacing(input.budgetMonth, now);
  const currentEvidence = buildEvidence(category, current, cyclePace, "current_tight");
  const projectedOverLimit = isProjectedOverLimit(currentEvidence);
  const tightByUsage = current.percent >= Math.max(TIGHT_LANGUAGE_FLOOR, category.warningThreshold, warningPoint(settings));
  const lockedOrOver = current.percent >= Math.min(category.hardStopThreshold, 100);
  const results: SuggestionCandidate[] = [];

  if (lockedOrOver || tightByUsage || projectedOverLimit) {
    const reasonCode: EvidenceReasonCode = lockedOrOver || tightByUsage ? "current_tight" : "likely_over_limit";
    const evidence = buildEvidence(category, current, cyclePace, reasonCode);
    const suggestedLimit = averageCompleted > category.limit * 1.08 ? roundToFive(Math.max(category.limit + 20, averageCompleted * 1.08, evidence.projectedEndSpend * 0.95)) : undefined;
    results.push({
      id: stableId(category.id, "overrun"),
      categoryId: category.id,
      type: "overrun",
      title: `${category.name} is at ${Math.round(evidence.usagePercent)}%`,
      explanation: projectedOverLimit && !tightByUsage && !lockedOrOver
        ? `${category.name} is at ${Math.round(evidence.usagePercent)}% while the cycle is ${Math.round(evidence.cycleProgressPercent)}% complete, pacing toward ${formatMoney(evidence.projectedEndSpend)}.`
        : `${category.name} is near its fence this cycle at ${Math.round(evidence.usagePercent)}% used.`,
      suggestedAction: `Review ${category.name}`,
      confidence: lockedOrOver || current.percent >= TIGHT_USAGE_PERCENT ? "high" : "medium",
      currentLimit: category.limit,
      suggestedLimit,
      estimatedMonthlyImpact: suggestedLimit ? roundMoney(suggestedLimit - category.limit) : undefined,
      metric: `${Math.round(current.percent)}% used`,
      evidence,
      priority: lockedOrOver ? 100 : projectedOverLimit ? 92 : 88,
      source: "local_rules"
    });
  }

  if (!results.some((suggestion) => suggestion.type === "overrun") && completedCycles.length >= 2 && averageCompleted > category.limit * 1.08 && current.percent >= SAFE_USAGE_PERCENT) {
    const evidence = buildEvidence(category, current, cyclePace, "recent_overages");
    const suggestedLimit = roundToFive(Math.max(category.limit + 20, averageCompleted * 1.08));
    results.push({
      id: stableId(category.id, "overrun"),
      categoryId: category.id,
      type: "overrun",
      title: `${category.name} has run over recently`,
      explanation: `${category.name} averaged ${formatMoney(averageCompleted)} across completed cycles, above the current ${formatMoney(category.limit)} fence.`,
      suggestedAction: `Review ${category.name}`,
      confidence: averageCompleted > category.limit * 1.16 ? "high" : "medium",
      currentLimit: category.limit,
      suggestedLimit,
      estimatedMonthlyImpact: roundMoney(suggestedLimit - category.limit),
      metric: `${formatMoney(averageCompleted)} recent average`,
      evidence,
      priority: 78,
      source: "local_rules"
    });
  }

  if (completedCycles.length >= 3 && averageCompleted > 0 && current.percent < SAFE_USAGE_PERCENT && averageCompleted < category.limit * underspendPoint(settings) && volatility < category.limit * 0.18) {
    const suggestedLimit = roundToFive(Math.max(25, averageCompleted * 1.15));
    if (category.limit - suggestedLimit >= 20) {
      const evidence = buildEvidence(category, current, cyclePace, "consistent_underuse");
      results.push({
        id: stableId(category.id, "underspend"),
        categoryId: category.id,
        type: "underspend",
        title: `${category.name} may have extra room`,
        explanation: `${category.name} has stayed about ${formatMoney(category.limit - averageCompleted)} under its fence in recent cycles.`,
        suggestedAction: `Reduce to ${formatMoney(suggestedLimit)}`,
        confidence: volatility < category.limit * 0.1 ? "high" : "medium",
        currentLimit: category.limit,
        suggestedLimit,
        estimatedMonthlyImpact: roundMoney(suggestedLimit - category.limit),
        metric: `${formatMoney(averageCompleted)} recent average`,
        evidence,
        priority: 54,
        source: "local_rules"
      });
    }
  }

  const pacingEvidence = buildEvidence(category, current, cyclePace, "ahead_of_pace");
  if (!results.some((suggestion) => suggestion.type === "overrun") && isMeaningfulPacingEvidence(pacingEvidence) && current.percent < category.hardStopThreshold) {
    results.push({
      id: stableId(category.id, "pacing"),
      categoryId: category.id,
      type: "pacing",
      title: `${category.name} pace is ahead`,
      explanation: `${category.name} is at ${Math.round(pacingEvidence.usagePercent)}% while the cycle is ${Math.round(pacingEvidence.cycleProgressPercent)}% complete.`,
      suggestedAction: "Check pacing",
      confidence: "medium",
      currentLimit: category.limit,
      metric: `${Math.round(current.percent)}% used`,
      evidence: pacingEvidence,
      priority: 68,
      source: "local_rules"
    });
  }

  if (weekendShare >= 0.6 && purchaseCount(category.id, input.purchases) >= 6 && current.percent >= SAFE_USAGE_PERCENT) {
    const evidence = buildEvidence(category, current, cyclePace, "weekend_cluster");
    results.push({
      id: stableId(category.id, "volatility"),
      categoryId: category.id,
      type: "volatility",
      title: `${category.name} shifts on weekends`,
      explanation: `${category.name} spending clusters more on weekends. A small weekend buffer could make this fence easier to follow.`,
      suggestedAction: "Watch weekend pattern",
      confidence: weekendShare > 0.62 ? "high" : "medium",
      currentLimit: category.limit,
      metric: `${Math.round(weekendShare * 100)}% weekend share`,
      evidence,
      priority: 48,
      source: "local_rules"
    });
  }

  if (recurringTotal >= 20 && recurringTotal > category.limit * 0.65) {
    const evidence = buildEvidence(category, current, cyclePace, "recurring_base");
    results.push({
      id: stableId(category.id, "recurring"),
      categoryId: category.id,
      type: "recurring",
      title: `${category.name} has a recurring base`,
      explanation: `Recurring charges make up a large part of this fence. Separating flexible spending from fixed charges may make it clearer.`,
      suggestedAction: "Review recurring base",
      confidence: recurringTotal > category.limit * 0.75 ? "high" : "medium",
      currentLimit: category.limit,
      metric: `${formatMoney(recurringTotal)} recurring`,
      evidence,
      priority: 42,
      source: "local_rules"
    });
  }

  return results;
}

function categoryCycleProgress(category: Category, input: AdaptiveFenceInput, now: Date) {
  const { start, nextStart } = currentCycleWindow(input.budgetMonth, now);
  const spent = input.purchases
    .filter((purchase) => purchase.categoryId === category.id)
    .filter((purchase) => {
      const date = new Date(purchase.date);
      return date >= start && date < nextStart;
    })
    .reduce((sum, purchase) => sum + Math.abs(Number(purchase.amount) || 0), 0);

  const percent = category.limit > 0 ? (spent / category.limit) * 100 : 0;
  return { spent, percent, remaining: category.limit - spent };
}

function buildEvidence(
  category: Category,
  current: ReturnType<typeof categoryCycleProgress>,
  cyclePace: ReturnType<typeof currentCyclePacing>,
  reasonCode: EvidenceReasonCode
): AdaptiveFenceSuggestionEvidence {
  const projectedEndSpend = current.spent <= 0 ? 0 : current.spent / Math.max(cyclePace.elapsedRatio, 0.08);

  return {
    categoryId: category.id,
    usagePercent: roundMoney(current.percent),
    cycleProgressPercent: roundMoney(cyclePace.elapsedRatio * 100),
    projectedEndSpend: roundMoney(projectedEndSpend),
    limit: category.limit,
    reasonCode
  };
}

function isProjectedOverLimit(evidence: AdaptiveFenceSuggestionEvidence) {
  return (
    evidence.cycleProgressPercent >= MIN_PACING_ELAPSED_RATIO * 100 &&
    evidence.usagePercent >= MIN_PACING_USAGE_PERCENT &&
    evidence.projectedEndSpend >= evidence.limit * PROJECTED_OVERAGE_MULTIPLIER
  );
}

function isMeaningfulPacingEvidence(evidence: AdaptiveFenceSuggestionEvidence) {
  const paceDelta = evidence.usagePercent - evidence.cycleProgressPercent;
  return (
    evidence.cycleProgressPercent >= MIN_PACING_ELAPSED_RATIO * 100 &&
    evidence.usagePercent >= MIN_PACING_USAGE_PERCENT &&
    paceDelta >= 18 &&
    evidence.projectedEndSpend >= evidence.limit * 0.95
  );
}

function suggestionRank(suggestion: SuggestionCandidate, events: FenceLearningEvent[]) {
  const confidenceScore = suggestion.confidence === "high" ? 3 : suggestion.confidence === "medium" ? 2 : 1;
  const impactScore = Math.min(Math.abs(suggestion.estimatedMonthlyImpact ?? 0) / 40, 2);
  return suggestion.priority + confidenceScore + impactScore + learningScoreForSuggestion(suggestion, events);
}

function previousCycleTotals(categoryId: string, purchases: Purchase[], budgetMonth: BudgetMonth, now: Date, count: number) {
  const { start } = currentCycleWindow(budgetMonth, now);
  return Array.from({ length: count }, (_, index) => {
    const cycleStart = addMonths(start, -(index + 1));
    const cycleEnd = addMonths(start, -index);
    const total = purchases
      .filter((purchase) => purchase.categoryId === categoryId)
      .filter((purchase) => {
        const date = new Date(purchase.date);
        return date >= cycleStart && date < cycleEnd;
      })
      .reduce((sum, purchase) => sum + Math.abs(Number(purchase.amount) || 0), 0);
    return { total, completed: cycleEnd < now };
  });
}

function currentCyclePacing(budgetMonth: BudgetMonth, now: Date) {
  const { start, nextStart } = currentCycleWindow(budgetMonth, now);
  const total = nextStart.getTime() - start.getTime();
  const elapsed = now.getTime() - start.getTime();
  return { elapsedRatio: Math.min(Math.max(elapsed / total, 0), 1) };
}

function categoryWeekendShare(categoryId: string, purchases: Purchase[]) {
  const categoryPurchases = purchases.filter((purchase) => purchase.categoryId === categoryId);
  if (!categoryPurchases.length) return 0;
  const weekend = categoryPurchases.filter((purchase) => {
    const day = new Date(purchase.date).getDay();
    return day === 0 || day === 6;
  }).length;
  return weekend / categoryPurchases.length;
}

function purchaseCount(categoryId: string, purchases: Purchase[]) {
  return purchases.filter((purchase) => purchase.categoryId === categoryId).length;
}

function normalizedMonthlyRecurringAmount(item: RecurringItem) {
  if (item.frequency === "weekly") return item.amount * 4.33;
  if (item.frequency === "biweekly") return item.amount * 2.17;
  if (item.frequency === "quarterly") return item.amount / 3;
  if (item.frequency === "yearly") return item.amount / 12;
  return item.amount;
}

function warningPoint(settings: AdaptiveFenceSettings) {
  if (settings.learningSensitivity === "conservative") return 94;
  if (settings.learningSensitivity === "adaptive") return 84;
  return 88;
}

function underspendPoint(settings: AdaptiveFenceSettings) {
  if (settings.learningSensitivity === "conservative") return 0.58;
  if (settings.learningSensitivity === "adaptive") return 0.76;
  return 0.68;
}

function suggestionLimit(frequency: AdaptiveFenceSettings["frequency"]) {
  if (frequency === "minimal") return 1;
  if (frequency === "active") return 3;
  return 2;
}

function stableId(categoryId: string, type: AdaptiveFenceSuggestion["type"]) {
  return `adaptive-${categoryId}-${type}`;
}

function addMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

function average(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function standardDeviation(values: number[]) {
  if (values.length < 2) return 0;
  const mean = average(values);
  const variance = average(values.map((value) => (value - mean) ** 2));
  return Math.sqrt(variance);
}

function roundToFive(value: number) {
  return Math.max(0, Math.round(value / 5) * 5);
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function formatMoney(value: number) {
  return `$${Math.round(value).toLocaleString()}`;
}

function safeText(value: unknown, fallback: string, maxLength: number) {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, maxLength) : fallback;
}

function safeGroundedText(value: unknown, fallback: string, maxLength: number) {
  if (typeof value !== "string" || !value.trim()) return fallback;
  const text = value.trim();
  const lower = text.toLowerCase();
  const unsupportedBroadClaim =
    lower.includes("all fences") ||
    lower.includes("all categories") ||
    lower.includes("everything") ||
    lower.includes("every fence") ||
    lower.includes("most fences") ||
    lower.includes("spending pressure is high") ||
    lower.includes("increase everything");

  return unsupportedBroadClaim ? fallback : text.slice(0, maxLength);
}

function safeOptionalText(value: unknown, fallback: string | undefined, maxLength: number) {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, maxLength) : fallback;
}

function validLimit(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function isSuggestionType(value: unknown): value is AdaptiveFenceSuggestion["type"] {
  return value === "overrun" || value === "underspend" || value === "pacing" || value === "volatility" || value === "recurring";
}
