import type { SpendFenceState } from "@/lib/types";

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function daysAgo(days: number, hour = 12, minute = 0) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

export function createCleanState(): SpendFenceState {
  return {
    budgetMonth: {
      id: "month-current",
      month: currentMonth(),
      income: 0,
      savingsTarget: 0,
      budgetCycleStartDay: 1
    },
    categories: [],
    purchases: [],
    recurringItems: [],
    receipts: [],
    importedTransactions: [],
    merchantCategoryRules: [],
    categoryCorrections: [],
    prompts: [],
    notificationSettings: {
      fiftyPercent: true,
      eightyPercent: true,
      limitReached: true,
      dailySummary: false,
      weeklyCheckIn: true
    },
    insightSettings: {
      spendingInsights: true,
      encouragementTone: "balanced",
      showDashboardInsights: true,
      showReportInsights: true,
      recurringDetection: true,
      trendSummaries: true,
      detailLevel: "balanced"
    },
    adaptiveFenceSettings: {
      enabled: true,
      frequency: "balanced",
      automationLevel: "require-confirmation",
      learningSensitivity: "moderate"
    },
    adaptiveSuggestions: {
      fingerprint: "",
      generatedAt: "",
      aiUsed: false,
      items: [],
      activeIndex: 0,
      expandedId: null
    },
    fenceLearningEvents: [],
    spendingRules: [],
    onboardingProfile: {
      completed: false,
      skipped: false,
      rhythm: "month-start",
      incomeFrequency: "monthly",
      guardrailMode: "balanced",
      selectedCategoryIds: [],
      customCategoryNames: [],
      futureReady: {
        plaidSync: true,
        aiInsights: true,
        recurringTransactions: true,
        sharedBudgeting: true,
        savingsGoals: true
      }
    },
    notifications: [],
    aiCategorizationEnabled: true
  };
}

export function createDemoState(): SpendFenceState {
  return {
    ...createCleanState(),
    budgetMonth: {
      id: "demo-month-current",
      month: currentMonth(),
      income: 6200,
      savingsTarget: 900,
      budgetCycleStartDay: 1
    },
    categories: [
      { id: "cat-groceries", name: "Groceries", limit: 720, warningThreshold: 80, hardStopThreshold: 100, color: "#5BA98C", icon: "basket" },
      { id: "cat-gas", name: "Gas", limit: 260, warningThreshold: 75, hardStopThreshold: 100, color: "#7894B6", icon: "fuel" },
      { id: "cat-eating", name: "Eating out", limit: 360, warningThreshold: 80, hardStopThreshold: 100, color: "#C89B53", icon: "utensils" },
      { id: "cat-kids", name: "Kids", limit: 420, warningThreshold: 85, hardStopThreshold: 100, color: "#87B7A9", icon: "heart" },
      { id: "cat-subs", name: "Subscriptions", limit: 120, warningThreshold: 90, hardStopThreshold: 100, color: "#6FB7A5", icon: "repeat" },
      { id: "cat-fun", name: "Fun money", limit: 280, warningThreshold: 80, hardStopThreshold: 100, color: "#7B84BD", icon: "sparkles" },
      { id: "cat-bills", name: "Bills", limit: 1850, warningThreshold: 95, hardStopThreshold: 100, color: "#7C8991", icon: "receipt" }
    ],
    purchases: [
      { id: "p-1", amount: 146.82, categoryId: "cat-groceries", merchant: "Whole Harvest", date: daysAgo(4, 17, 45), notes: "Weekly groceries", source: "manual" },
      { id: "p-2", amount: 52.18, categoryId: "cat-gas", merchant: "Shell", date: daysAgo(3, 8, 10), notes: "", source: "manual" },
      { id: "p-3", amount: 74.46, categoryId: "cat-eating", merchant: "Taco Garden", date: daysAgo(2, 19, 5), notes: "Family dinner", source: "manual" },
      { id: "p-4", amount: 249.99, categoryId: "cat-kids", merchant: "Little League", date: daysAgo(1, 14, 30), notes: "Season fee", source: "manual" },
      { id: "p-5", amount: 17.99, categoryId: "cat-subs", merchant: "Streamly", date: daysAgo(7, 9, 0), notes: "Monthly plan", source: "manual" },
      { id: "p-6", amount: 96.4, categoryId: "cat-fun", merchant: "Cinema House", date: daysAgo(1, 20, 15), notes: "Tickets and snacks", source: "manual" },
      { id: "p-7", amount: 1320, categoryId: "cat-bills", merchant: "Rent", date: daysAgo(8, 8, 0), notes: "Monthly rent", source: "manual" }
    ],
    recurringItems: [
      {
        id: "rec-rent",
        name: "Rent",
        amount: 1320,
        kind: "bill",
        frequency: "monthly",
        nextDate: daysAgo(-22, 8, 0),
        categoryId: "cat-bills",
        notes: "Monthly housing payment",
        active: true,
        sourcePurchaseId: "p-7",
        detected: false,
        createdAt: daysAgo(8, 8, 5),
        updatedAt: daysAgo(8, 8, 5)
      },
      {
        id: "rec-streamly",
        name: "Streamly",
        amount: 17.99,
        kind: "subscription",
        frequency: "monthly",
        nextDate: daysAgo(-23, 9, 0),
        categoryId: "cat-subs",
        notes: "Streaming subscription",
        active: true,
        sourcePurchaseId: "p-5",
        detected: false,
        createdAt: daysAgo(7, 9, 5),
        updatedAt: daysAgo(7, 9, 5)
      },
      {
        id: "rec-paycheck",
        name: "Paycheck",
        amount: 3100,
        kind: "income",
        frequency: "biweekly",
        nextDate: daysAgo(-5, 8, 0),
        notes: "Sample take-home pay",
        active: true,
        detected: false,
        createdAt: daysAgo(10, 8, 0),
        updatedAt: daysAgo(10, 8, 0)
      }
    ],
    spendingRules: [
      {
        id: "spending-rule-eating-out-single",
        title: "Eating out over $60",
        description: "Warn when a single eating out purchase exceeds $60.",
        categoryId: "cat-eating",
        type: "amount",
        condition: "exceeds_amount",
        thresholdAmount: 60,
        thresholdCount: 3,
        thresholdPercent: 18,
        timeWindow: "week",
        timeContext: "late_night",
        response: "warning",
        enabled: true,
        source: "manual",
        createdAt: daysAgo(6, 10, 0),
        updatedAt: daysAgo(6, 10, 0)
      },
      {
        id: "spending-rule-fun-pace",
        title: "Fun money pace check",
        description: "Surface a pacing alert when fun money starts moving faster than the cycle.",
        categoryId: "cat-fun",
        type: "category_pacing",
        condition: "pace_accelerating",
        thresholdPercent: 18,
        timeWindow: "cycle",
        response: "pacing_alert",
        enabled: true,
        source: "manual",
        createdAt: daysAgo(5, 10, 0),
        updatedAt: daysAgo(5, 10, 0)
      }
    ],
    merchantCategoryRules: [
      {
        id: "rule-shell",
        merchantNameNormalized: "shell",
        categoryId: "cat-gas",
        source: "system_rule",
        confidence: 0.9,
        lastUsedAt: daysAgo(3)
      }
    ],
    onboardingProfile: {
      ...createCleanState().onboardingProfile,
      completed: true,
      completedAt: daysAgo(12),
      selectedCategoryIds: ["cat-groceries", "cat-gas", "cat-eating", "cat-kids", "cat-subs", "cat-fun", "cat-bills"],
      customCategoryNames: []
    },
    prompts: [
      { id: "prompt-1", message: "Set a grocery limit for this month.", type: "setup" },
      { id: "prompt-2", message: "Eating out is trending high. Lower the limit or slow spending?", type: "trend" },
      { id: "prompt-3", message: "You usually spend more on weekends.", type: "trend" },
      { id: "prompt-4", message: "Want to roll unused gas money into savings?", type: "saving" },
      { id: "prompt-5", message: "You are 5 days into the month and already at 40% of Kids.", type: "warning" }
    ],
    notifications: [
      {
        id: "n-1",
        title: "Kids is close",
        body: "Careful - Kids is close to the monthly limit.",
        level: "warning",
        createdAt: daysAgo(0, 9, 20),
        read: false
      }
    ]
  };
}

export const initialState: SpendFenceState = createCleanState();
