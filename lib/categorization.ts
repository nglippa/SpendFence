import type { Category, CategorySuggestion, ImportedTransactionInput, MerchantCategoryRule } from "@/lib/types";

const keywordRules: Array<{ keywords: string[]; names: string[]; reason: string; confidence: number }> = [
  { keywords: ["starbucks", "mcdonald", "chipotle", "taco", "restaurant", "cafe", "coffee"], names: ["Eating out", "Dining"], reason: "Matched common eating-out merchant keywords.", confidence: 0.86 },
  { keywords: ["walmart", "target", "kroger", "heb", "whole foods", "grocery", "market"], names: ["Groceries", "Household"], reason: "Matched grocery or general-store merchant patterns.", confidence: 0.78 },
  { keywords: ["shell", "exxon", "chevron", "mobil", "gas", "fuel"], names: ["Gas", "Auto"], reason: "Matched fuel merchant keywords.", confidence: 0.9 },
  { keywords: ["netflix", "spotify", "apple", "hulu", "disney", "subscription"], names: ["Subscriptions"], reason: "Matched subscription merchant keywords.", confidence: 0.86 },
  { keywords: ["amazon"], names: ["Shopping", "Household"], reason: "Matched Amazon shopping pattern.", confidence: 0.7 },
  { keywords: ["cvs", "walgreens", "pharmacy", "rx"], names: ["Medicine", "Household"], reason: "Matched pharmacy merchant keywords.", confidence: 0.74 }
];

const plaidRules: Array<{ hints: string[]; names: string[]; confidence: number }> = [
  { hints: ["food and drink", "restaurants", "coffee"], names: ["Eating out"], confidence: 0.82 },
  { hints: ["supermarkets", "groceries"], names: ["Groceries"], confidence: 0.86 },
  { hints: ["gas stations"], names: ["Gas"], confidence: 0.9 },
  { hints: ["shops", "general merchandise"], names: ["Shopping", "Household"], confidence: 0.72 },
  { hints: ["subscription", "digital"], names: ["Subscriptions"], confidence: 0.82 },
  { hints: ["pharmacies", "medical"], names: ["Medicine", "Household"], confidence: 0.75 }
];

export function categorizeTransaction(
  transaction: Pick<ImportedTransactionInput, "merchantName" | "description" | "amount" | "plaidCategory">,
  userCategories: Category[],
  merchantRules: MerchantCategoryRule[]
): CategorySuggestion {
  const merchantNameNormalized = normalizeMerchant(transaction.merchantName);
  const exactRule = merchantRules
    .filter((rule) => rule.merchantNameNormalized === merchantNameNormalized)
    .sort((a, b) => b.confidence - a.confidence)[0];

  if (exactRule && categoryExists(exactRule.categoryId, userCategories)) {
    return {
      suggestedCategoryId: exactRule.categoryId,
      confidence: Math.max(exactRule.confidence, 0.9),
      confidenceLabel: "high",
      reason: `You previously categorized ${transaction.merchantName} this way.`,
      source: "merchant_rule"
    };
  }

  const text = `${transaction.merchantName} ${transaction.description}`.toLowerCase();
  for (const rule of keywordRules) {
    if (rule.keywords.some((keyword) => text.includes(keyword))) {
      const category = findCategory(rule.names, userCategories);
      if (category) {
        return {
          suggestedCategoryId: category.id,
          confidence: rule.confidence,
          confidenceLabel: labelForConfidence(rule.confidence),
          reason: rule.reason,
          source: "keyword"
        };
      }
    }
  }

  const plaidCategory = transaction.plaidCategory?.toLowerCase() ?? "";
  if (plaidCategory) {
    for (const rule of plaidRules) {
      if (rule.hints.some((hint) => plaidCategory.includes(hint))) {
        const category = findCategory(rule.names, userCategories);
        if (category) {
          return {
            suggestedCategoryId: category.id,
            confidence: rule.confidence,
            confidenceLabel: labelForConfidence(rule.confidence),
            reason: `Mapped Plaid category hint “${transaction.plaidCategory}” to your budget.`,
            source: "plaid_mapping"
          };
        }
      }
    }
  }

  const fallback = findCategory(["Groceries", "Household", "Fun money"], userCategories) ?? userCategories[0];
  return {
    suggestedCategoryId: fallback?.id ?? "",
    confidence: fallback ? 0.45 : 0,
    confidenceLabel: "low",
    reason: fallback ? "No strong rule matched. This needs a quick review." : "Create a category to classify this transaction.",
    source: "fallback"
  };
}

export function normalizeMerchant(merchantName: string) {
  return merchantName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function labelForConfidence(confidence: number): CategorySuggestion["confidenceLabel"] {
  if (confidence >= 0.82) return "high";
  if (confidence >= 0.62) return "medium";
  return "low";
}

function findCategory(names: string[], categories: Category[]) {
  return categories.find((category) => names.some((name) => category.name.toLowerCase() === name.toLowerCase()));
}

function categoryExists(categoryId: string, categories: Category[]) {
  return categories.some((category) => category.id === categoryId);
}
