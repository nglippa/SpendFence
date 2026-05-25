import { currentCycleWindow } from "@/lib/budget";
import type { AdaptiveFenceSettings, BudgetMonth, Category, Purchase, RecurringItem } from "@/lib/types";

export type AdaptiveSuggestionFingerprintInput = {
  categories: Category[];
  purchases: Purchase[];
  recurringItems?: RecurringItem[];
  budgetMonth: BudgetMonth;
  settings?: AdaptiveFenceSettings;
  now?: Date;
};

export function buildAdaptiveSuggestionFingerprint(input: AdaptiveSuggestionFingerprintInput) {
  const now = input.now ?? new Date();
  const { start } = currentCycleWindow(input.budgetMonth, now);
  const payload = {
    cycleStart: start.toISOString().slice(0, 10),
    budgetMonth: {
      month: input.budgetMonth.month,
      income: input.budgetMonth.income,
      savingsTarget: input.budgetMonth.savingsTarget,
      budgetCycleStartDay: input.budgetMonth.budgetCycleStartDay,
      budgetCycleStartDate: input.budgetMonth.budgetCycleStartDate ?? null
    },
    settings: input.settings
      ? {
          enabled: input.settings.enabled,
          frequency: input.settings.frequency,
          automationLevel: input.settings.automationLevel,
          learningSensitivity: input.settings.learningSensitivity
        }
      : null,
    categories: input.categories
      .map((category) => ({
        id: category.id,
        name: category.name,
        limit: category.limit,
        warningThreshold: category.warningThreshold,
        hardStopThreshold: category.hardStopThreshold
      }))
      .sort((a, b) => a.id.localeCompare(b.id)),
    purchases: input.purchases
      .map((purchase) => ({
        id: purchase.id,
        amount: purchase.amount,
        categoryId: purchase.categoryId,
        merchant: purchase.merchant,
        date: purchase.date,
        recurringId: purchase.recurringId ?? null,
        source: purchase.source
      }))
      .sort((a, b) => a.id.localeCompare(b.id)),
    recurringItems: (input.recurringItems ?? [])
      .map((item) => ({
        id: item.id,
        amount: item.amount,
        categoryId: item.categoryId,
        frequency: item.frequency,
        active: item.active,
        nextDate: item.nextDate
      }))
      .sort((a, b) => a.id.localeCompare(b.id))
  };

  return hashStableJson(payload);
}

function hashStableJson(value: unknown) {
  const json = JSON.stringify(value);
  let hash = 5381;

  for (let index = 0; index < json.length; index += 1) {
    hash = (hash * 33) ^ json.charCodeAt(index);
  }

  return `adaptive-${(hash >>> 0).toString(36)}`;
}
