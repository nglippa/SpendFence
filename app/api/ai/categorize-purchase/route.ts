import { NextResponse } from "next/server";
import { AI_TONE_INSTRUCTIONS, callGroqJson, redactSensitiveFinancialText } from "@/lib/ai/groq";
import type { AiCategory, PurchaseCategorizationResult } from "@/lib/ai/types";
import { categorizeTransaction } from "@/lib/categorization";
import type { Category, ImportedTransactionInput, MerchantCategoryRule } from "@/lib/types";

type RequestBody = {
  merchant?: string;
  amount?: number;
  notes?: string;
  categories?: Category[];
  currentUserCategories?: Category[];
  userCategories?: Category[];
  merchantRules?: MerchantCategoryRule[];
  transaction?: Pick<ImportedTransactionInput, "merchantName" | "description" | "amount" | "plaidCategory">;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RequestBody;
    const categories = normalizeCategories(body.categories ?? body.currentUserCategories ?? body.userCategories ?? []);
    const merchant = body.merchant ?? body.transaction?.merchantName ?? "";
    const amount = Number(body.amount ?? body.transaction?.amount ?? 0);
    const notes = redactSensitiveFinancialText(body.notes ?? body.transaction?.description ?? "");
    const merchantRules = body.merchantRules ?? [];
    const fallback = localCategorization(merchant, amount, notes, categories, merchantRules, body.transaction?.plaidCategory);

    const groq = await callGroqJson<Partial<PurchaseCategorizationResult>>({
      fallback,
      maxTokens: 500,
      messages: [
        {
          role: "system",
          content: [
            "You suggest one budget category for a purchase.",
            "Return JSON with suggestedCategoryId, confidence, and reason.",
            "Use only provided category ids or null.",
            "Confidence must be low, medium, or high.",
            "Do not infer identity or sensitive traits.",
            AI_TONE_INSTRUCTIONS
          ].join(" ")
        },
        {
          role: "user",
          content: JSON.stringify({
            purchase: { merchant, amount, notes },
            categories: categories.map((category) => ({ id: category.id, name: category.name })),
            priorMerchantRules: merchantRules.map((rule) => ({ categoryId: rule.categoryId, confidence: rule.confidence })).slice(0, 20)
          })
        }
      ]
    });

    return NextResponse.json(normalizeCategorization(groq.data, categories, fallback));
  } catch {
    return NextResponse.json({ suggestedCategoryId: null, confidence: "low", reason: "Unable to suggest a category right now." } satisfies PurchaseCategorizationResult);
  }
}

function localCategorization(
  merchant: string,
  amount: number,
  notes: string,
  categories: AiCategory[],
  merchantRules: MerchantCategoryRule[],
  plaidCategory?: string
): PurchaseCategorizationResult {
  const suggestion = categorizeTransaction(
    {
      merchantName: merchant,
      description: notes,
      amount,
      plaidCategory
    },
    categories as Category[],
    merchantRules
  );

  return {
    suggestedCategoryId: suggestion.suggestedCategoryId || null,
    confidence: suggestion.confidenceLabel,
    reason: suggestion.reason
  };
}

function normalizeCategorization(
  parsed: Partial<PurchaseCategorizationResult>,
  categories: AiCategory[],
  fallback: PurchaseCategorizationResult
): PurchaseCategorizationResult {
  const categoryIds = new Set(categories.map((category) => category.id));
  const suggestedCategoryId = parsed.suggestedCategoryId && categoryIds.has(parsed.suggestedCategoryId) ? parsed.suggestedCategoryId : fallback.suggestedCategoryId;

  return {
    suggestedCategoryId,
    confidence: parsed.confidence === "high" || parsed.confidence === "medium" || parsed.confidence === "low" ? parsed.confidence : fallback.confidence,
    reason: typeof parsed.reason === "string" && parsed.reason.trim() ? parsed.reason.trim().slice(0, 180) : fallback.reason
  };
}

function normalizeCategories(categories: Category[]): AiCategory[] {
  return categories.map((category) => ({ id: category.id, name: category.name, limit: category.limit }));
}
