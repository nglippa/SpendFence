import { NextResponse } from "next/server";
import { categorizeTransaction, labelForConfidence } from "@/lib/categorization";
import type { Category, CategorySuggestion, ImportedTransactionInput, MerchantCategoryRule } from "@/lib/types";

type RequestBody = {
  transaction: Pick<ImportedTransactionInput, "merchantName" | "description" | "amount" | "plaidCategory">;
  userCategories: Category[];
  merchantRules: MerchantCategoryRule[];
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RequestBody;
    const safeTransaction = {
      merchantName: body.transaction.merchantName,
      description: body.transaction.description,
      amount: body.transaction.amount,
      plaidCategory: body.transaction.plaidCategory
    };
    const safeCategories = body.userCategories.map((category) => ({
      ...category,
      name: category.name
    }));
    const localSuggestion = categorizeTransaction(safeTransaction, safeCategories, body.merchantRules);

    if (!process.env.OPENAI_API_KEY || localSuggestion.confidence >= 0.62) {
      return NextResponse.json({ suggestion: localSuggestion, aiUsed: false });
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You categorize budget transactions. Return strict JSON with suggestedCategoryId, confidence from 0 to 1, and reason. Use only provided category ids. Do not infer identity or use sensitive data."
          },
          {
            role: "user",
            content: JSON.stringify({
              transaction: safeTransaction,
              categories: safeCategories.map((category) => ({ id: category.id, name: category.name }))
            })
          }
        ]
      })
    });

    if (!response.ok) return NextResponse.json({ suggestion: localSuggestion, aiUsed: false });
    const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const parsed = JSON.parse(data.choices?.[0]?.message?.content ?? "{}") as Partial<CategorySuggestion>;
    const suggestedCategoryId = parsed.suggestedCategoryId;
    const categoryExists = safeCategories.some((category) => category.id === suggestedCategoryId);
    if (!suggestedCategoryId || !categoryExists || typeof parsed.confidence !== "number") {
      return NextResponse.json({ suggestion: localSuggestion, aiUsed: false });
    }

    return NextResponse.json({
      aiUsed: true,
      suggestion: {
        suggestedCategoryId,
        confidence: Math.max(0, Math.min(1, parsed.confidence)),
        confidenceLabel: labelForConfidence(parsed.confidence),
        reason: parsed.reason ?? "AI matched this to the closest existing budget category.",
        source: "ai"
      } satisfies CategorySuggestion
    });
  } catch {
    return NextResponse.json({ message: "Unable to categorize transaction safely." }, { status: 400 });
  }
}
