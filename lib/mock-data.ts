import type { SpendFenceState } from "@/lib/types";

const now = new Date();
const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

function daysAgo(days: number, hour = 12, minute = 0) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

export const initialState: SpendFenceState = {
  budgetMonth: {
    id: "month-current",
    month,
    income: 6200,
    savingsTarget: 900
  },
  categories: [
    { id: "cat-groceries", name: "Groceries", limit: 720, warningThreshold: 80, hardStopThreshold: 100, color: "#58c6a8", icon: "basket" },
    { id: "cat-gas", name: "Gas", limit: 260, warningThreshold: 75, hardStopThreshold: 100, color: "#5b8def", icon: "fuel" },
    { id: "cat-eating", name: "Eating out", limit: 360, warningThreshold: 80, hardStopThreshold: 100, color: "#f59e6b", icon: "utensils" },
    { id: "cat-kids", name: "Kids", limit: 420, warningThreshold: 85, hardStopThreshold: 100, color: "#a78bfa", icon: "heart" },
    { id: "cat-subs", name: "Subscriptions", limit: 120, warningThreshold: 90, hardStopThreshold: 100, color: "#38bdf8", icon: "repeat" },
    { id: "cat-fun", name: "Fun money", limit: 280, warningThreshold: 80, hardStopThreshold: 100, color: "#f472b6", icon: "sparkles" },
    { id: "cat-bills", name: "Bills", limit: 1850, warningThreshold: 95, hardStopThreshold: 100, color: "#64748b", icon: "receipt" }
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
  receipts: [],
  importedTransactions: [],
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
  categoryCorrections: [],
  prompts: [
    { id: "prompt-1", message: "Set a grocery limit for this month.", type: "setup" },
    { id: "prompt-2", message: "Eating out is trending high. Lower the limit or slow spending?", type: "trend" },
    { id: "prompt-3", message: "You usually spend more on weekends.", type: "trend" },
    { id: "prompt-4", message: "Want to roll unused gas money into savings?", type: "saving" },
    { id: "prompt-5", message: "You are 5 days into the month and already at 40% of Kids.", type: "warning" }
  ],
  notificationSettings: {
    fiftyPercent: true,
    eightyPercent: true,
    limitReached: true,
    dailySummary: false,
    weeklyCheckIn: true
  },
  notifications: [
    {
      id: "n-1",
      title: "Kids is close",
      body: "Careful — Kids is close to the monthly limit.",
      level: "warning",
      createdAt: daysAgo(0, 9, 20),
      read: false
    }
  ],
  aiCategorizationEnabled: true
};
