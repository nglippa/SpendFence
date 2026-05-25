import { categoryProgress, currentCycleWindow } from "@/lib/budget";
import { filterLearnedSuggestions, learningScoreForSuggestion } from "@/lib/ai/fence-learning";
import type { AdaptiveFenceSettings, AdaptiveFenceSuggestion, BudgetMonth, Category, FenceLearningEvent, Purchase, RecurringItem } from "@/lib/types";

export type AdaptiveFenceInput = {
  categories: Category[];
  purchases: Purchase[];
  recurringItems?: RecurringItem[];
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

export function generateLocalFenceSuggestions(input: AdaptiveFenceInput): AdaptiveFenceSuggestion[] {
  const settings = { ...DEFAULT_SETTINGS, ...input.settings };
  if (!settings.enabled || !input.categories.length) return [];

  const now = input.now ? new Date(input.now) : new Date();
  const learningEvents = input.learningEvents ?? [];
  const suggestions = input.categories.flatMap((category) => suggestionsForCategory(category, input, settings, now));
  const learned = filterLearnedSuggestions(suggestions, learningEvents, now);

  return learned
    .sort((a, b) => suggestionRank(b, learningEvents) - suggestionRank(a, learningEvents))
    .slice(0, suggestionLimit(settings.frequency));
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

      return {
        id: fallbackSuggestion?.id ?? stableId(categoryId, type),
        categoryId,
        type,
        title: safeText(suggestion.title, fallbackSuggestion?.title ?? `${category.name} fence note`, 56),
        explanation: safeText(suggestion.explanation, fallbackSuggestion?.explanation ?? "SpendFence found a small pattern worth reviewing.", 150),
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
        source: suggestion.source === "groq" ? "groq" : fallbackSuggestion?.source ?? "local_rules"
      } satisfies AdaptiveFenceSuggestion;
    })
    .filter(Boolean) as AdaptiveFenceSuggestion[];

  return normalized.length ? normalized : fallback;
}

function suggestionsForCategory(category: Category, input: AdaptiveFenceInput, settings: AdaptiveFenceSettings, now: Date) {
  if (category.limit <= 0) return [];

  const current = categoryProgress(category, input.purchases, input.budgetMonth);
  const cycles = previousCycleTotals(category.id, input.purchases, input.budgetMonth, now, 4);
  const completedCycles = cycles.filter((cycle) => cycle.completed);
  const averageCompleted = average(completedCycles.map((cycle) => cycle.total));
  const volatility = standardDeviation(completedCycles.map((cycle) => cycle.total));
  const recurringTotal = (input.recurringItems ?? [])
    .filter((item) => item.active && item.categoryId === category.id && (item.kind === "bill" || item.kind === "subscription"))
    .reduce((sum, item) => sum + normalizedMonthlyRecurringAmount(item), 0);
  const weekendShare = categoryWeekendShare(category.id, input.purchases);
  const cyclePace = currentCyclePacing(input.budgetMonth, now);
  const results: AdaptiveFenceSuggestion[] = [];

  if ((current.percent >= warningPoint(settings) && current.remaining < category.limit * 0.22) || averageCompleted > category.limit * 1.04) {
    results.push({
      id: stableId(category.id, "overrun"),
      categoryId: category.id,
      type: "overrun",
      title: `${category.name} fence is running tight`,
      explanation: averageCompleted > category.limit
        ? `${category.name} has been landing above its fence across recent cycles. A slightly wider fence may fit your actual rhythm.`
        : `${category.name} is pacing close to its fence this cycle. It may be worth reviewing before cycle end.`,
      suggestedAction: `Review ${category.name}`,
      confidence: averageCompleted > category.limit * 1.08 ? "high" : "medium",
      currentLimit: category.limit,
      suggestedLimit: averageCompleted > category.limit * 1.04 ? roundToFive(Math.max(category.limit + 20, averageCompleted * 1.08)) : undefined,
      estimatedMonthlyImpact: averageCompleted > category.limit * 1.04 ? roundMoney(roundToFive(Math.max(category.limit + 20, averageCompleted * 1.08)) - category.limit) : undefined,
      metric: `${Math.round(current.percent)}% used`,
      source: "local_rules"
    });
  }

  if (completedCycles.length >= 2 && averageCompleted > 0 && averageCompleted < category.limit * underspendPoint(settings) && volatility < category.limit * 0.18) {
    const suggestedLimit = roundToFive(Math.max(25, averageCompleted * 1.15));
    if (category.limit - suggestedLimit >= 20) {
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
        source: "local_rules"
      });
    }
  }

  if (cyclePace.elapsedRatio > 0.18 && current.percent / 100 > cyclePace.elapsedRatio + 0.18 && current.percent < category.hardStopThreshold) {
    results.push({
      id: stableId(category.id, "pacing"),
      categoryId: category.id,
      type: "pacing",
      title: `${category.name} pace is ahead`,
      explanation: `${category.name} is moving faster than the cycle pace. A small check-in may keep the fence realistic.`,
      suggestedAction: "Check pacing",
      confidence: "medium",
      currentLimit: category.limit,
      metric: `${Math.round(current.percent)}% used`,
      source: "local_rules"
    });
  }

  if (weekendShare >= 0.48 && purchaseCount(category.id, input.purchases) >= 4) {
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
      source: "local_rules"
    });
  }

  if (recurringTotal > 0 && recurringTotal > category.limit * 0.55) {
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
      source: "local_rules"
    });
  }

  return results;
}

function suggestionRank(suggestion: AdaptiveFenceSuggestion, events: FenceLearningEvent[]) {
  const confidenceScore = suggestion.confidence === "high" ? 3 : suggestion.confidence === "medium" ? 2 : 1;
  const impactScore = Math.min(Math.abs(suggestion.estimatedMonthlyImpact ?? 0) / 40, 2);
  return confidenceScore + impactScore + learningScoreForSuggestion(suggestion, events);
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
  if (frequency === "minimal") return 2;
  if (frequency === "active") return 6;
  return 4;
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

function safeOptionalText(value: unknown, fallback: string | undefined, maxLength: number) {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, maxLength) : fallback;
}

function validLimit(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function isSuggestionType(value: unknown): value is AdaptiveFenceSuggestion["type"] {
  return value === "overrun" || value === "underspend" || value === "pacing" || value === "volatility" || value === "recurring";
}

