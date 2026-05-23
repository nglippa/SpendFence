import { NextResponse } from "next/server";
import type { Category, MerchantCategoryRule, ReceiptCategoryAllocation, ReceiptLineItem } from "@/lib/types";

type RequestBody = {
  receiptText?: string;
  merchantHint?: string;
  totalHint?: number;
  userCategories: Category[];
  merchantRules?: MerchantCategoryRule[];
};

type ReceiptAnalysis = {
  merchant: string;
  date: string;
  total: number;
  lineItems: ReceiptLineItem[];
  allocations: ReceiptCategoryAllocation[];
  confidence: number;
  reason: string;
  aiUsed: boolean;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RequestBody;
    const categories = Array.isArray(body.userCategories) ? body.userCategories : [];
    const safeText = redactSensitiveReceiptText(body.receiptText ?? "");
    const fallback = fallbackAnalysis(categories, body.merchantHint, body.totalHint, safeText);

    if (!process.env.OPENAI_API_KEY || !safeText.trim()) {
      return NextResponse.json(fallback);
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
              "Extract a consumer receipt into strict JSON. Return merchant, date ISO string, total number, lineItems array of {name, amount}, allocations array of {categoryId, amount, confidence, reason}, confidence number 0-1, and reason. Use only provided category ids. Never include card numbers, account numbers, or sensitive payment details."
          },
          {
            role: "user",
            content: JSON.stringify({
              receiptText: safeText,
              categories: categories.map((category) => ({ id: category.id, name: category.name })),
              merchantHint: body.merchantHint,
              totalHint: body.totalHint
            })
          }
        ]
      })
    });

    if (!response.ok) return NextResponse.json(fallback);
    const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const parsed = JSON.parse(data.choices?.[0]?.message?.content ?? "{}") as Partial<ReceiptAnalysis>;
    const analysis = normalizeAnalysis(parsed, categories, fallback);
    return NextResponse.json({ ...analysis, aiUsed: true });
  } catch {
    return NextResponse.json({ message: "Unable to analyze receipt safely." }, { status: 400 });
  }
}

function fallbackAnalysis(categories: Category[], merchantHint?: string, totalHint?: number, receiptText?: string): ReceiptAnalysis {
  const merchant = merchantHint?.trim() || merchantFromText(receiptText) || "Fresh Basket Market";
  const total = totalHint && totalHint > 0 ? totalHint : 83.42;
  const lineItems = [
    { id: "line-1", name: "Produce and pantry", amount: roundMoney(total * 0.5) },
    { id: "line-2", name: "Household supplies", amount: roundMoney(total * 0.3) },
    { id: "line-3", name: "General items", amount: roundMoney(total - roundMoney(total * 0.5) - roundMoney(total * 0.3)) }
  ];
  const grocery = findCategory(categories, ["grocery", "groceries", "food"]);
  const household = findCategory(categories, ["household", "home"]);
  const fallbackCategory = grocery ?? household ?? categories[0];
  const allocations = household && grocery && household.id !== grocery.id
    ? [
        { id: "allocation-1", categoryId: grocery.id, amount: roundMoney(total * 0.68), confidence: 0.72, reason: "Food-like receipt items matched groceries." },
        { id: "allocation-2", categoryId: household.id, amount: roundMoney(total - roundMoney(total * 0.68)), confidence: 0.62, reason: "Household-like items were split out for review." }
      ]
    : fallbackCategory
      ? [{ id: "allocation-1", categoryId: fallbackCategory.id, amount: total, confidence: 0.64, reason: "Fallback matched the closest available budget category." }]
      : [];

  return {
    merchant,
    date: new Date().toISOString(),
    total,
    lineItems,
    allocations,
    confidence: 0.64,
    reason: "Mock receipt extraction is shown for review because OCR text was not available.",
    aiUsed: false
  };
}

function normalizeAnalysis(parsed: Partial<ReceiptAnalysis>, categories: Category[], fallback: ReceiptAnalysis): ReceiptAnalysis {
  const categoryIds = new Set(categories.map((category) => category.id));
  const lineItems = Array.isArray(parsed.lineItems) && parsed.lineItems.length
    ? parsed.lineItems.map((item, index) => ({
        id: item.id || `line-${index + 1}`,
        name: item.name || `Receipt item ${index + 1}`,
        amount: roundMoney(Number(item.amount) || 0)
      }))
    : fallback.lineItems;
  const total = roundMoney(Number(parsed.total) || lineItems.reduce((sum, item) => sum + item.amount, 0) || fallback.total);
  const allocations = Array.isArray(parsed.allocations)
    ? parsed.allocations
        .filter((allocation) => allocation.categoryId && categoryIds.has(allocation.categoryId))
        .map((allocation, index) => ({
          id: allocation.id || `allocation-${index + 1}`,
          categoryId: allocation.categoryId,
          amount: roundMoney(Number(allocation.amount) || 0),
          confidence: clamp01(Number(allocation.confidence) || 0.5),
          reason: allocation.reason || "AI matched this category for part of the receipt."
        }))
    : [];

  return {
    merchant: parsed.merchant || fallback.merchant,
    date: validDate(parsed.date) ?? fallback.date,
    total,
    lineItems,
    allocations: allocations.length ? allocations : fallback.allocations,
    confidence: clamp01(Number(parsed.confidence) || fallback.confidence),
    reason: parsed.reason || "AI extracted the receipt and matched it to your budget categories.",
    aiUsed: true
  };
}

function redactSensitiveReceiptText(text: string) {
  return text
    .replace(/\b(?:\d[ -]*?){13,19}\b/g, "[redacted-card]")
    .replace(/\b(?:account|acct)\s*#?\s*\d{4,}\b/gi, "account [redacted]")
    .slice(0, 6000);
}

function merchantFromText(text = "") {
  return text.split(/\r?\n/).map((line) => line.trim()).find((line) => line && !/\d/.test(line));
}

function findCategory(categories: Category[], names: string[]) {
  return categories.find((category) => names.some((name) => category.name.toLowerCase().includes(name)));
}

function validDate(value: unknown) {
  if (typeof value !== "string") return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}
