import { categoryProgress, currentCycleWindow, formatMoney, purchasesForCycle } from "@/lib/budget";
import type { BudgetMonth, Category, Purchase, SpendFenceState } from "@/lib/types";
import type { BehavioralInsight, BehavioralInsightPlacement, InsightGenerationOptions } from "@/lib/insights/insight-types";
import {
  buildInsightPriorityScore,
  calculateCycleTiming,
  calculateSpendingVariance,
  categoryTotals,
  detectRecurringBehavior,
  detectTrendChanges,
  totalSpend
} from "@/lib/reports/report-metrics";
import { generateSpendingRuleInsights } from "@/lib/rules/rule-engine";

const DAY_MS = 86_400_000;

export function generateBehavioralInsights(state: SpendFenceState, options: InsightGenerationOptions = {}): BehavioralInsight[] {
  if (!state.insightSettings.spendingInsights) return [];

  const now = options.now ?? new Date();
  const tone = options.tone ?? state.insightSettings.encouragementTone;
  const currentPurchases = purchasesForCycle(state.purchases, state.budgetMonth, now);
  const previousPurchases = purchasesForPreviousCycle(state.purchases, state.budgetMonth, now);
  const previousComparablePurchases = purchasesForPreviousComparableWindow(state.purchases, state.budgetMonth, now);
  const insights: BehavioralInsight[] = [];

  insights.push(...emptyInsights(state, currentPurchases));
  insights.push(...gentleCautionInsights(state, currentPurchases));
  insights.push(...generateSpendingRuleInsights(state, { ...options, now }));
  insights.push(...recoveryInsights(state, currentPurchases, previousComparablePurchases, tone));
  insights.push(...positiveControlInsights(state, currentPurchases));
  insights.push(...stabilizationInsights(currentPurchases, previousComparablePurchases));
  insights.push(...trendInsights(state, currentPurchases, previousPurchases));
  insights.push(...reportNarrativeInsights(state, currentPurchases, previousComparablePurchases, previousPurchases, now));

  return withInsightMetadata(insights, state.categories)
    .filter((insight) => (options.placement ? insight.recommendedPlacement === options.placement : true))
    .filter((insight) => (options.categoryId ? insight.categoryId === options.categoryId : true))
    .sort(compareInsights);
}

export function selectDashboardInsight(state: SpendFenceState, now = new Date()) {
  if (!state.insightSettings.showDashboardInsights) return undefined;
  return generateBehavioralInsights(state, { now, placement: "dashboard" })[0];
}

export function selectCategoryInsight(state: SpendFenceState, categoryId: string, now = new Date()) {
  return generateBehavioralInsights(state, { now, placement: "category", categoryId })[0];
}

export function selectReportInsights(state: SpendFenceState, now = new Date(), limit = 5) {
  return selectSmartReportInsights(state, now, limit);
}

export function selectSmartReportInsights(state: SpendFenceState, now = new Date(), limit = 5) {
  const insights = generateBehavioralInsights(state, { now, placement: "reports" });
  if (insights.length <= limit) return insights;

  const warningCap = 1;
  let warningsUsed = 0;
  const seenTypes = new Set<string>();
  const selected: BehavioralInsight[] = [];

  rotateByCycle(insights, state.budgetMonth, now).forEach((insight) => {
    if (selected.length >= limit) return;
    if ((insight.severity === "watch" || insight.severity === "limit") && warningsUsed >= warningCap) return;

    const repetitionKey = `${insight.type}:${insight.categoryId ?? insight.freshnessKey ?? insight.title}`;
    if (seenTypes.has(repetitionKey)) return;

    selected.push(insight);
    seenTypes.add(repetitionKey);
    if (insight.severity === "watch" || insight.severity === "limit") warningsUsed += 1;
  });

  return selected;
}

function emptyInsights(state: SpendFenceState, currentPurchases: Purchase[]): BehavioralInsight[] {
  const categoryEmptyInsights = state.categories
    .filter((category) => !currentPurchases.some((purchase) => purchase.categoryId === category.id))
    .map((category) => ({
      id: `empty-category-${category.id}`,
      type: "empty" as const,
      title: "No activity yet",
      message: `${category.name} has no activity this cycle yet.`,
      confidence: "high" as const,
      recommendedPlacement: "category" as const,
      categoryId: category.id,
      severity: "calm" as const
    }));

  if (state.categories.length === 0) {
    return [
      {
        id: "empty-categories",
        type: "empty",
        title: "Set your fences",
        message: "Set limits for a few categories to unlock better guidance.",
        confidence: "high",
        recommendedPlacement: "dashboard",
        severity: "calm"
      },
      {
        id: "reports-empty-categories",
        type: "empty",
        title: "Patterns need categories",
        message: "Reports will show clearer spending patterns once a few category limits are in place.",
        confidence: "high",
        recommendedPlacement: "reports",
        severity: "calm"
      },
      {
        id: "reports-empty-limits",
        type: "empty",
        title: "Better reporting ahead",
        message: "Add purchases across a few categories to unlock smarter reporting.",
        confidence: "high",
        recommendedPlacement: "reports",
        severity: "calm"
      },
      {
        id: "reports-empty-cycle",
        type: "empty",
        title: "Cycle context",
        message: "Reports become more useful after one full budget cycle.",
        confidence: "medium",
        recommendedPlacement: "reports",
        severity: "calm"
      }
    ];
  }

  if (currentPurchases.length === 0) {
    return [
      {
        id: "empty-purchases",
        type: "empty",
        title: "First patterns",
        message: "Add a few purchases to start seeing spending patterns.",
        confidence: "high",
        recommendedPlacement: "dashboard",
        severity: "calm"
      },
      {
        id: "reports-empty-purchases",
        type: "empty",
        title: "Patterns will appear here",
        message: "Your first spending insights will appear as SpendFence learns your rhythm.",
        confidence: "high",
        recommendedPlacement: "reports",
        severity: "calm"
      },
      {
        id: "reports-empty-category-spread",
        type: "empty",
        title: "Category range",
        message: "Add purchases across a few categories to unlock smarter reporting.",
        confidence: "medium",
        recommendedPlacement: "reports",
        severity: "calm"
      },
      {
        id: "reports-empty-full-cycle",
        type: "empty",
        title: "Full-cycle view",
        message: "Reports become more useful after one full budget cycle.",
        confidence: "medium",
        recommendedPlacement: "reports",
        severity: "calm"
      },
      ...categoryEmptyInsights
    ];
  }

  if (currentPurchases.length < 3) {
    return [
      {
        id: "empty-more-data",
        type: "empty",
        title: "Early cycle read",
        message: "A few more purchases will make SpendFence's local patterns more useful.",
        confidence: "medium",
        recommendedPlacement: "dashboard",
        severity: "calm"
      },
      ...categoryEmptyInsights
    ];
  }

  return categoryEmptyInsights;
}

function gentleCautionInsights(state: SpendFenceState, currentPurchases: Purchase[]): BehavioralInsight[] {
  const cautions = state.categories
    .map((category) => ({ category, progress: categoryProgress(category, currentPurchases) }))
    .filter(({ progress }) => progress.percent >= 65)
    .sort((a, b) => b.progress.percent - a.progress.percent);

  const categoryInsights = cautions.slice(0, 3).map(({ category, progress }) => {
    const isLimit = progress.percent >= category.hardStopThreshold;
    const isWarning = progress.percent >= category.warningThreshold;
    return {
      id: `${isLimit ? "limit" : "caution"}-${category.id}`,
      type: "gentle_caution" as const,
      title: isLimit ? "Fence reached" : "Needs attention",
      message: isLimit
        ? `${category.name} has reached its fence for this cycle.`
        : isWarning
          ? `${category.name} is getting close to its fence.`
          : `${category.name} may need a slower pace this week.`,
      supportingMetric: `${Math.round(progress.percent)}% used`,
      confidence: "high" as const,
      recommendedPlacement: "category" as const,
      categoryId: category.id,
      severity: isLimit ? ("limit" as const) : ("watch" as const)
    };
  });

  const dashboardWarning = cautions.find(({ progress, category }) => progress.percent >= category.warningThreshold);
  const dashboardInsight: BehavioralInsight[] = dashboardWarning
    ? [
        {
          id: `dashboard-caution-${dashboardWarning.category.id}`,
          type: "gentle_caution",
          title: dashboardWarning.progress.percent >= dashboardWarning.category.hardStopThreshold ? "Fence reached" : "Watch this week",
          message:
            dashboardWarning.progress.percent >= dashboardWarning.category.hardStopThreshold
              ? `${dashboardWarning.category.name} has reached its fence for this cycle.`
              : `${dashboardWarning.category.name} is getting close to its fence.`,
          supportingMetric: `${Math.round(dashboardWarning.progress.percent)}% used`,
          confidence: "high",
          recommendedPlacement: "dashboard",
          categoryId: dashboardWarning.category.id,
          severity: dashboardWarning.progress.percent >= dashboardWarning.category.hardStopThreshold ? "limit" : "watch"
        }
      ]
    : [];

  const reportInsight =
    cautions.length > 1
      ? [
          {
            id: "reports-caution-count",
            type: "gentle_caution" as const,
            title: "Categories to watch",
            message: "A few categories are approaching their limits.",
            supportingMetric: `${cautions.length} categories`,
            confidence: "high" as const,
            recommendedPlacement: "reports" as const,
            severity: "watch" as const,
            priorityScore: 95
          }
        ]
      : [];

  return [...dashboardInsight, ...categoryInsights, ...reportInsight];
}

function recoveryInsights(state: SpendFenceState, currentPurchases: Purchase[], previousComparablePurchases: Purchase[], tone: SpendFenceState["insightSettings"]["encouragementTone"]): BehavioralInsight[] {
  if (currentPurchases.length < 2 || previousComparablePurchases.length < 2) return [];

  const recoveries = state.categories
    .map((category) => {
      const current = categoryTotal(category.id, currentPurchases);
      const previous = categoryTotal(category.id, previousComparablePurchases);
      const drop = previous > 0 ? ((previous - current) / previous) * 100 : 0;
      return { category, current, previous, drop };
    })
    .filter((item) => item.previous >= 40 && item.drop >= 18)
    .sort((a, b) => b.drop - a.drop);

  const categoryInsights = recoveries.slice(0, 3).map(({ category, drop }) => ({
    id: `recovery-${category.id}`,
    type: "recovery" as const,
    title: "Lower pace",
    message: tone === "minimal" ? `${category.name} is down from last cycle.` : `Recovery in ${category.name} compared with last cycle.`,
    supportingMetric: `${Math.round(drop)}% lower`,
    confidence: drop >= 30 ? ("high" as const) : ("medium" as const),
    recommendedPlacement: "category" as const,
    categoryId: category.id,
    severity: "positive" as const
  }));

  const top = recoveries[0];
  const dashboardInsight: BehavioralInsight[] = top
    ? [
        {
          id: `dashboard-recovery-${top.category.id}`,
          type: "recovery",
          title: "Spending pressure eased",
          message: `${top.category.name} is down from last cycle.`,
          supportingMetric: `${Math.round(top.drop)}% lower`,
          confidence: top.drop >= 30 ? "high" : "medium",
          recommendedPlacement: "dashboard",
          categoryId: top.category.id,
          severity: "positive"
        }
      ]
    : [];

  const reportInsight =
    recoveries.length > 1
      ? [
          {
            id: "reports-recovery-count",
            type: "recovery" as const,
            title: "Pressure eased",
            message: "Spending pressure eased in a few categories.",
            supportingMetric: `${recoveries.length} categories`,
            confidence: "medium" as const,
            recommendedPlacement: "reports" as const,
            severity: "positive" as const,
            priorityScore: 82
          }
        ]
      : [];

  return [...dashboardInsight, ...categoryInsights, ...reportInsight];
}

function positiveControlInsights(state: SpendFenceState, currentPurchases: Purchase[]): BehavioralInsight[] {
  if (currentPurchases.length < 2 || state.categories.length === 0) return [];

  const withProgress = state.categories.map((category) => ({ category, progress: categoryProgress(category, currentPurchases) }));
  const controlled = withProgress.filter(({ category, progress }) => progress.spent > 0 && progress.percent <= Math.max(55, category.warningThreshold - 15));
  const categoriesWithSpending = withProgress.filter(({ progress }) => progress.spent > 0);
  const sortedControlled = controlled.sort((a, b) => a.progress.percent - b.progress.percent);
  const mostControlled = sortedControlled[0];
  const mostRoom = withProgress
    .filter(({ progress }) => progress.remaining > 0)
    .sort((a, b) => b.progress.remaining - a.progress.remaining)[0];

  const insights: BehavioralInsight[] = [];

  if (controlled.length >= Math.max(2, Math.ceil(categoriesWithSpending.length * 0.55))) {
    insights.push({
      id: "dashboard-most-under-limit",
      type: "positive_control",
      title: "Room left",
      message: "You have room left in most categories.",
      supportingMetric: `${controlled.length} steady categories`,
      confidence: "high",
      recommendedPlacement: "dashboard",
      severity: "positive"
    });
  }

  sortedControlled.forEach(({ category, progress }) => {
    insights.push({
      id: `control-${category.id}`,
      type: "positive_control",
      title: "Inside the fence",
      message: `${category.name} is tracking comfortably below its limit.`,
      supportingMetric: `${Math.round(progress.percent)}% used`,
      confidence: "high",
      recommendedPlacement: "category",
      categoryId: category.id,
      severity: "positive"
    });
  });

  if (mostRoom) {
    insights.push({
      id: `reports-control-${mostRoom.category.id}`,
      type: "positive_control",
      title: "Strongest control",
      message: `Your strongest category control this cycle is ${mostRoom.category.name}.`,
      supportingMetric: `${formatMoney(mostRoom.progress.remaining)} left`,
      confidence: "medium",
      recommendedPlacement: "reports",
      categoryId: mostRoom.category.id,
      severity: "positive",
      priorityScore: 64
    });
  }

  return insights;
}

function stabilizationInsights(currentPurchases: Purchase[], previousComparablePurchases: Purchase[]): BehavioralInsight[] {
  if (currentPurchases.length < 5 || previousComparablePurchases.length < 5) return [];

  const currentVariance = dailySpendStandardDeviation(currentPurchases);
  const previousVariance = dailySpendStandardDeviation(previousComparablePurchases);
  if (previousVariance <= 0 || currentVariance > previousVariance * 0.88) return [];

  const improvement = Math.round(((previousVariance - currentVariance) / previousVariance) * 100);
  const confidence = improvement >= 18 ? "high" : "medium";

  return [
    {
      id: "dashboard-stabilization",
      type: "stabilization",
      title: "Steady pace",
      message: "Spending is stabilizing compared with your last cycle.",
      supportingMetric: `${improvement}% lower variance`,
      confidence,
      recommendedPlacement: "dashboard",
      severity: "calm"
    },
    {
      id: "reports-stabilization",
      type: "stabilization",
      title: "Predictable pace",
      message: "Your weekly pace is more predictable than last cycle.",
      supportingMetric: `${improvement}% lower variance`,
      confidence,
      recommendedPlacement: "reports",
      severity: "calm",
      priorityScore: buildInsightPriorityScore({ base: 68, confidence, freshness: Math.min(8, Math.round(improvement / 4)) })
    }
  ];
}

function trendInsights(state: SpendFenceState, currentPurchases: Purchase[], previousPurchases: Purchase[]): BehavioralInsight[] {
  if (currentPurchases.length < 3) return [];

  const insights: BehavioralInsight[] = [];
  const total = currentPurchases.reduce((sum, purchase) => sum + purchase.amount, 0);
  const weekendTotal = currentPurchases.filter(isWeekendPurchase).reduce((sum, purchase) => sum + purchase.amount, 0);
  const weekendPercent = total > 0 ? Math.round((weekendTotal / total) * 100) : 0;

  if (weekendPercent >= 38) {
    insights.push({
      id: "trend-weekend-dashboard",
      type: "trend",
      title: "Weekend pattern",
      message: "Most flexible spending has happened on weekends.",
      supportingMetric: `${weekendPercent}% weekend`,
      confidence: currentPurchases.length >= 6 ? "high" : "medium",
      recommendedPlacement: "dashboard",
      severity: "calm"
    });
    insights.push({
      id: "trend-weekend-reports",
      type: "trend",
      title: "Weekend pattern",
      message: `Weekend spending accounts for ${weekendPercent}% of this cycle.`,
      supportingMetric: `${formatMoney(weekendTotal)} total`,
      confidence: currentPurchases.length >= 6 ? "high" : "medium",
      recommendedPlacement: "reports",
      severity: "calm",
      priorityScore: buildInsightPriorityScore({ base: 56, confidence: currentPurchases.length >= 6 ? "high" : "medium", freshness: Math.min(8, weekendPercent - 38) })
    });
  }

  const repeatMerchant = repeatedSmallMerchant(currentPurchases);
  if (repeatMerchant) {
    insights.push({
      id: `trend-repeat-${repeatMerchant.key}`,
      type: "trend",
      title: "Repeat purchases",
      message: "Small repeat purchases are adding up this cycle.",
      supportingMetric: `${repeatMerchant.count} at ${repeatMerchant.merchant}`,
      confidence: repeatMerchant.count >= 4 ? "high" : "medium",
      recommendedPlacement: "reports",
      severity: "calm",
      priorityScore: buildInsightPriorityScore({ base: 58, confidence: repeatMerchant.count >= 4 ? "high" : "medium", freshness: repeatMerchant.count })
    });
  }

  const biggestFlexible = biggestFlexibleCategory(state.categories, currentPurchases);
  if (biggestFlexible) {
    insights.push({
      id: `trend-flex-${biggestFlexible.category.id}`,
      type: "trend",
      title: "Flexible area",
      message: `${biggestFlexible.category.name} is your biggest flexible area this cycle.`,
      supportingMetric: formatMoney(biggestFlexible.amount),
      confidence: "medium",
      recommendedPlacement: "reports",
      categoryId: biggestFlexible.category.id,
      severity: "calm",
      priorityScore: 52
    });
  }

  const subscriptions = state.categories.find((category) => /sub|membership|recurring/i.test(category.name));
  if (subscriptions) {
    const current = categoryTotal(subscriptions.id, currentPurchases);
    const previous = categoryTotal(subscriptions.id, previousPurchases);
    if (current > 0 && previous > 0 && current > previous * 1.08) {
      insights.push({
        id: `trend-subscriptions-${subscriptions.id}`,
        type: "trend",
        title: "Subscription drift",
        message: `${subscriptions.name} are consistent but slowly increasing.`,
        supportingMetric: `${Math.round(((current - previous) / previous) * 100)}% higher`,
        confidence: "medium",
        recommendedPlacement: "reports",
        categoryId: subscriptions.id,
        severity: "watch",
        priorityScore: 76
      });
    }
  }

  state.categories.forEach((category) => {
    const categoryPurchases = currentPurchases.filter((purchase) => purchase.categoryId === category.id);
    if (categoryPurchases.length < 3) return;
    const weekendCategoryPercent = Math.round((categoryPurchases.filter(isWeekendPurchase).length / categoryPurchases.length) * 100);
    if (weekendCategoryPercent >= 60) {
      insights.push({
        id: `category-weekend-${category.id}`,
        type: "trend",
        title: "Timing pattern",
        message: "This category has most activity on weekends.",
        supportingMetric: `${weekendCategoryPercent}% weekend`,
        confidence: categoryPurchases.length >= 5 ? "high" : "medium",
        recommendedPlacement: "category",
        categoryId: category.id,
        severity: "calm"
      });
    }
  });

  return insights;
}

function reportNarrativeInsights(
  state: SpendFenceState,
  currentPurchases: Purchase[],
  previousComparablePurchases: Purchase[],
  previousPurchases: Purchase[],
  now: Date
): BehavioralInsight[] {
  if (currentPurchases.length < 3) return [];

  const insights: BehavioralInsight[] = [];
  const timing = calculateCycleTiming(state.budgetMonth, now);
  const currentTotal = totalSpend(currentPurchases);
  const previousComparableTotal = totalSpend(previousComparablePurchases);
  const currentTotals = categoryTotals(currentPurchases);
  const previousTotals = categoryTotals(previousComparablePurchases);

  state.categories.forEach((category) => {
    const progress = categoryProgress(category, currentPurchases);
    if (progress.spent <= 0 || category.limit <= 0) return;

    const projected = (progress.spent / timing.elapsedDays) * timing.cycleDays;
    const projectedPercent = (projected / category.limit) * 100;
    if (projectedPercent >= category.warningThreshold && progress.percent < category.warningThreshold) {
      insights.push({
        id: `reports-pace-${category.id}`,
        type: "gentle_caution",
        title: "Pace to watch",
        message: `${category.name} is still manageable, but its current pace may get tight before the cycle ends.`,
        supportingMetric: `${Math.round(projectedPercent)}% projected`,
        confidence: timing.elapsedDays >= 5 ? "high" : "medium",
        recommendedPlacement: "reports",
        categoryId: category.id,
        severity: "watch",
        priorityScore: buildInsightPriorityScore({ base: 88, confidence: timing.elapsedDays >= 5 ? "high" : "medium" })
      });
    }
  });

  const fastestGrowing = state.categories
    .map((category) => {
      const current = currentTotals.get(category.id) ?? 0;
      const previous = previousTotals.get(category.id) ?? 0;
      const change = detectTrendChanges(current, previous);
      return { category, current, previous, change };
    })
    .filter((item) => item.current >= 35 && item.change.direction === "up" && item.change.percent >= 18)
    .sort((a, b) => b.change.percent - a.change.percent)[0];

  if (fastestGrowing) {
    insights.push({
      id: `reports-growing-${fastestGrowing.category.id}`,
      type: "trend",
      title: "Fastest growing area",
      message: `${fastestGrowing.category.name} is rising faster than other categories this cycle.`,
      supportingMetric: `${fastestGrowing.change.percent}% higher`,
      confidence: fastestGrowing.previous > 0 ? "medium" : "low",
      recommendedPlacement: "reports",
      categoryId: fastestGrowing.category.id,
      severity: "watch",
      priorityScore: buildInsightPriorityScore({ base: 72, confidence: fastestGrowing.previous > 0 ? "medium" : "low", warningPenalty: 4 })
    });
  }

  const strongestRecovery = state.categories
    .map((category) => {
      const current = currentTotals.get(category.id) ?? 0;
      const previous = previousTotals.get(category.id) ?? 0;
      const change = detectTrendChanges(current, previous);
      return { category, current, previous, change };
    })
    .filter((item) => item.previous >= 40 && item.change.direction === "down" && Math.abs(item.change.delta) >= 25)
    .sort((a, b) => Math.abs(b.change.delta) - Math.abs(a.change.delta))[0];

  if (strongestRecovery) {
    insights.push({
      id: `reports-dollar-recovery-${strongestRecovery.category.id}`,
      type: "recovery",
      title: "Recovery trend",
      message: `${strongestRecovery.category.name} spending improved compared with your previous cycle.`,
      supportingMetric: `${formatMoney(Math.abs(strongestRecovery.change.delta))} lower`,
      confidence: "high",
      recommendedPlacement: "reports",
      categoryId: strongestRecovery.category.id,
      severity: "positive",
      priorityScore: 86
    });
  }

  const recurring = detectRecurringBehavior([...currentPurchases, ...previousPurchases]).find((item) => item.total >= 30);
  if (recurring) {
    insights.push({
      id: `reports-recurring-${recurring.key}`,
      type: "trend",
      title: "Recurring rhythm",
      message: `${recurring.merchant} appears consistently enough to watch as a recurring expense.`,
      supportingMetric: `${recurring.count} purchases`,
      confidence: recurring.count >= 3 ? "high" : "medium",
      recommendedPlacement: "reports",
      severity: "calm",
      priorityScore: buildInsightPriorityScore({ base: 54, confidence: recurring.count >= 3 ? "high" : "medium" })
    });
  }

  if (previousComparablePurchases.length >= 3 && currentTotal > 0) {
    const change = detectTrendChanges(currentTotal, previousComparableTotal);
    if (change.direction === "down" && change.percent >= 10) {
      insights.push({
        id: "reports-cycle-eased",
        type: "recovery",
        title: "Cycle comparison",
        message: "Spending pressure eased slightly compared with the same point last cycle.",
        supportingMetric: `${change.percent}% lower`,
        confidence: "medium",
        recommendedPlacement: "reports",
        severity: "positive",
        priorityScore: 78
      });
    } else if (change.direction === "up" && change.percent >= 15) {
      insights.push({
        id: "reports-cycle-pressure",
        type: "gentle_caution",
        title: "Cycle comparison",
        message: "Spending is running higher than the same point last cycle, but there is still time to adjust.",
        supportingMetric: `${change.percent}% higher`,
        confidence: "medium",
        recommendedPlacement: "reports",
        severity: "watch",
        priorityScore: 84
      });
    }
  }

  const stableCategory = state.categories
    .map((category) => {
      const current = currentPurchases.filter((purchase) => purchase.categoryId === category.id);
      const previous = previousComparablePurchases.filter((purchase) => purchase.categoryId === category.id);
      const currentVariance = calculateSpendingVariance(current);
      const previousVariance = calculateSpendingVariance(previous);
      const improvement = previousVariance > 0 ? Math.round(((previousVariance - currentVariance) / previousVariance) * 100) : 0;
      return { category, current, previous, improvement };
    })
    .filter((item) => item.current.length >= 3 && item.previous.length >= 3 && item.improvement >= 12)
    .sort((a, b) => b.improvement - a.improvement)[0];

  if (stableCategory) {
    insights.push({
      id: `reports-category-stability-${stableCategory.category.id}`,
      type: "stabilization",
      title: "Steadier pace",
      message: `Spending variance is lower than last cycle, especially in ${stableCategory.category.name}.`,
      supportingMetric: `${stableCategory.improvement}% more stable`,
      confidence: stableCategory.improvement >= 20 ? "high" : "medium",
      recommendedPlacement: "reports",
      categoryId: stableCategory.category.id,
      severity: "calm",
      priorityScore: buildInsightPriorityScore({ base: 70, confidence: stableCategory.improvement >= 20 ? "high" : "medium" })
    });
  }

  return insights;
}

function compareInsights(a: BehavioralInsight, b: BehavioralInsight) {
  const severityPriority = { limit: 0, watch: 1, positive: 2, calm: 3 };
  const typePriority = {
    gentle_caution: 0,
    spending_rule: 1,
    recovery: 2,
    positive_control: 3,
    stabilization: 4,
    trend: 5,
    empty: 6
  };
  const confidencePriority = { high: 0, medium: 1, low: 2 };
  return (
    (b.priorityScore ?? 0) - (a.priorityScore ?? 0) ||
    severityPriority[a.severity] - severityPriority[b.severity] ||
    typePriority[a.type] - typePriority[b.type] ||
    confidencePriority[a.confidence] - confidencePriority[b.confidence] ||
    a.id.localeCompare(b.id)
  );
}

function withInsightMetadata(insights: BehavioralInsight[], categories: Category[]) {
  return insights.map((insight) => ({
    ...insight,
    source: insight.source ?? ("local_rules" as const),
    freshnessKey: insight.freshnessKey ?? `${insight.recommendedPlacement}-${insight.type}-${insight.categoryId ?? insight.id}`,
    categoryLabel: insight.categoryLabel ?? categories.find((category) => category.id === insight.categoryId)?.name,
    priorityScore: insight.priorityScore ?? defaultPriorityScore(insight)
  }));
}

function defaultPriorityScore(insight: BehavioralInsight) {
  const typeScore = {
    gentle_caution: 80,
    spending_rule: 72,
    recovery: 70,
    stabilization: 62,
    positive_control: 58,
    trend: 48,
    empty: 36
  }[insight.type];
  const severityBoost = { limit: 16, watch: 10, positive: 4, calm: 0 }[insight.severity];
  const confidenceBoost = { high: 8, medium: 4, low: 0 }[insight.confidence];
  return typeScore + severityBoost + confidenceBoost;
}

function rotateByCycle(insights: BehavioralInsight[], budgetMonth: Pick<BudgetMonth, "budgetCycleStartDay">, now: Date) {
  const sorted = [...insights].sort(compareInsights);
  const timing = calculateCycleTiming(budgetMonth, now);
  const top = sorted.slice(0, 2);
  const rest = sorted.slice(2);
  if (rest.length <= 1) return sorted;
  const offset = timing.elapsedDays % rest.length;
  return [...top, ...rest.slice(offset), ...rest.slice(0, offset)];
}

function purchasesForPreviousCycle(purchases: Purchase[], budgetMonth: Pick<BudgetMonth, "budgetCycleStartDay">, now: Date) {
  const { start } = currentCycleWindow(budgetMonth, now);
  return purchasesForCycle(purchases, budgetMonth, new Date(start.getTime() - 1));
}

function purchasesForPreviousComparableWindow(purchases: Purchase[], budgetMonth: Pick<BudgetMonth, "budgetCycleStartDay">, now: Date) {
  const current = currentCycleWindow(budgetMonth, now);
  const previous = currentCycleWindow(budgetMonth, new Date(current.start.getTime() - 1));
  const elapsedDays = Math.max(1, Math.floor((now.getTime() - current.start.getTime()) / DAY_MS) + 1);
  const comparableEnd = new Date(previous.start.getTime() + elapsedDays * DAY_MS);
  return purchases.filter((purchase) => {
    const date = new Date(purchase.date);
    return date >= previous.start && date < comparableEnd;
  });
}

function categoryTotal(categoryId: string, purchases: Purchase[]) {
  return purchases.filter((purchase) => purchase.categoryId === categoryId).reduce((sum, purchase) => sum + purchase.amount, 0);
}

function dailySpendStandardDeviation(purchases: Purchase[]) {
  return calculateSpendingVariance(purchases);
}

function isWeekendPurchase(purchase: Purchase) {
  const day = new Date(purchase.date).getDay();
  return day === 0 || day === 6;
}

function repeatedSmallMerchant(purchases: Purchase[]) {
  const map = new Map<string, { merchant: string; count: number; total: number }>();
  purchases.forEach((purchase) => {
    if (purchase.amount > 35) return;
    const key = purchase.merchant.trim().toLowerCase();
    const current = map.get(key) ?? { merchant: purchase.merchant, count: 0, total: 0 };
    map.set(key, { ...current, count: current.count + 1, total: current.total + purchase.amount });
  });
  const [key, value] =
    Array.from(map.entries())
      .filter(([, item]) => item.count >= 3 && item.total >= 25)
      .sort((a, b) => b[1].total - a[1].total)[0] ?? [];
  return key ? { key, ...value } : undefined;
}

function biggestFlexibleCategory(categories: Category[], purchases: Purchase[]) {
  const fixedPattern = /bill|rent|mortgage|utility|insurance|loan/i;
  return categories
    .filter((category) => !fixedPattern.test(category.name))
    .map((category) => ({ category, amount: categoryTotal(category.id, purchases) }))
    .filter((item) => item.amount > 0)
    .sort((a, b) => b.amount - a.amount)[0];
}
