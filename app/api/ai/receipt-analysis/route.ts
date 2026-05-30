import { NextResponse } from "next/server";
import { AI_TONE_INSTRUCTIONS, callGroqJson, redactSensitiveFinancialText } from "@/lib/ai/groq";
import { logAiEvent } from "@/lib/ai/observability";
import type { AiCategory, AiConfidence, ReceiptAnalysisResult } from "@/lib/ai/types";
import type { Category } from "@/lib/types";

type RequestBody = {
  receiptText?: string;
  merchantHint?: string;
  totalHint?: number;
  categories?: Category[];
  userCategories?: Category[];
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RequestBody;
    const categories = normalizeCategories(body.categories ?? body.userCategories ?? []);
    const receiptText = redactSensitiveFinancialText(body.receiptText ?? "");
    const fallback = fallbackReceiptAnalysis(categories, body.merchantHint, body.totalHint, receiptText);

    const startedAt = Date.now();
    const groq = await callGroqJson<Partial<ReceiptAnalysisResult>>({
      fallback,
      maxTokens: 1200,
      messages: [
        {
          role: "system",
          content: [
            "You analyze consumer receipts for a budgeting app.",
            "Return JSON with merchant, date, total, lineItems, categorySplits, and summary.",
            "Use only provided category ids or null.",
            "Line item confidence must be low, medium, or high.",
            "Category split amounts must add up close to total when a total is available.",
            "Never include card numbers, account numbers, payment details, or identity guesses.",
            AI_TONE_INSTRUCTIONS
          ].join(" ")
        },
        {
          role: "user",
          content: JSON.stringify({
            receiptText,
            merchantHint: body.merchantHint,
            totalHint: body.totalHint,
            categories: categories.map((category) => ({ id: category.id, name: category.name }))
          })
        }
      ]
    });

    logAiEvent({ endpoint: "receipt-analysis", aiUsed: groq.aiUsed, latencyMs: Date.now() - startedAt, fallback: !groq.aiUsed });
    return NextResponse.json(normalizeReceiptAnalysis(groq.data, categories, fallback));
  } catch (error) {
    logAiEvent({ endpoint: "receipt-analysis", aiUsed: false, latencyMs: 0, fallback: true, error });
    return NextResponse.json(fallbackReceiptAnalysis([], undefined, undefined, ""), { status: 200 });
  }
}

function fallbackReceiptAnalysis(categories: AiCategory[], merchantHint?: string, totalHint?: number, receiptText?: string): ReceiptAnalysisResult {
  const merchant = merchantHint?.trim() || merchantFromText(receiptText) || "Receipt merchant";
  const total = totalHint && totalHint > 0 ? roundMoney(totalHint) : amountFromText(receiptText);
  const grocery = findCategory(categories, ["grocery", "groceries", "food"]);
  const household = findCategory(categories, ["household", "home"]);
  const fallbackCategory = grocery ?? household ?? categories[0];
  const fallbackTotal = total ?? 0;

  const lineItems = fallbackTotal
    ? [
        {
          name: "Receipt items",
          amount: fallbackTotal,
          suggestedCategoryId: fallbackCategory?.id ?? null,
          confidence: fallbackCategory ? ("medium" as const) : ("low" as const)
        }
      ]
    : [];

  const categorySplits =
    fallbackTotal && grocery && household && grocery.id !== household.id
      ? [
          { categoryId: grocery.id, amount: roundMoney(fallbackTotal * 0.68), reason: "Food-like receipt items matched groceries." },
          { categoryId: household.id, amount: roundMoney(fallbackTotal - roundMoney(fallbackTotal * 0.68)), reason: "Household-like items were split out for review." }
        ]
      : fallbackTotal && fallbackCategory
        ? [{ categoryId: fallbackCategory.id, amount: fallbackTotal, reason: "Matched the closest available budget category for review." }]
        : [];

  return {
    merchant,
    date: null,
    total,
    lineItems,
    categorySplits,
    summary: "Receipt suggestions are ready to review before saving."
  };
}

function normalizeReceiptAnalysis(parsed: Partial<ReceiptAnalysisResult>, categories: AiCategory[], fallback: ReceiptAnalysisResult): ReceiptAnalysisResult {
  const categoryIds = new Set(categories.map((category) => category.id));
  const total = nullableMoney(parsed.total) ?? fallback.total;
  const lineItems = Array.isArray(parsed.lineItems)
    ? parsed.lineItems.slice(0, 40).map((item) => ({
        name: typeof item?.name === "string" && item.name.trim() ? item.name.trim().slice(0, 80) : "Receipt item",
        amount: nullableMoney(item?.amount),
        suggestedCategoryId: categoryIds.has(String(item?.suggestedCategoryId)) ? String(item?.suggestedCategoryId) : null,
        confidence: normalizeConfidence(item?.confidence)
      }))
    : fallback.lineItems;

  const categorySplits = Array.isArray(parsed.categorySplits)
    ? parsed.categorySplits
        .filter((split) => split?.categoryId && categoryIds.has(split.categoryId))
        .map((split) => ({
          categoryId: split.categoryId,
          amount: roundMoney(Number(split.amount) || 0),
          reason: typeof split.reason === "string" && split.reason.trim() ? split.reason.trim().slice(0, 180) : "Suggested for review."
        }))
        .filter((split) => split.amount > 0)
    : fallback.categorySplits;

  return {
    merchant: typeof parsed.merchant === "string" && parsed.merchant.trim() ? parsed.merchant.trim().slice(0, 80) : fallback.merchant,
    date: validDate(parsed.date) ?? fallback.date,
    total,
    lineItems: lineItems.length ? lineItems : fallback.lineItems,
    categorySplits: categorySplits.length ? categorySplits : fallback.categorySplits,
    summary: typeof parsed.summary === "string" && parsed.summary.trim() ? parsed.summary.trim().slice(0, 220) : fallback.summary
  };
}

function normalizeCategories(categories: Category[]): AiCategory[] {
  return categories.map((category) => ({ id: category.id, name: category.name, limit: category.limit }));
}

function normalizeConfidence(value: unknown): AiConfidence {
  return value === "high" || value === "medium" || value === "low" ? value : "medium";
}

function nullableMoney(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? roundMoney(parsed) : null;
}

function validDate(value: unknown) {
  if (typeof value !== "string") return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function merchantFromText(text = "") {
  return text.split(/\r?\n/).map((line) => line.trim()).find((line) => line && !/\d/.test(line));
}

function amountFromText(text = "") {
  const matches = [...text.matchAll(/(?:total|amount due|balance)\D{0,16}(\d+(?:\.\d{2})?)/gi)];
  const value = matches.at(-1)?.[1];
  return value ? roundMoney(Number(value)) : null;
}

function findCategory(categories: AiCategory[], names: string[]) {
  return categories.find((category) => names.some((name) => category.name.toLowerCase().includes(name)));
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}
