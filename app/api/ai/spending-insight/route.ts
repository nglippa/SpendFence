import { NextResponse } from "next/server";
import { AI_TONE_INSTRUCTIONS, callGroqJson } from "@/lib/ai/groq";
import type { AiCategory, SpendingInsightInput, SpendingInsightResult } from "@/lib/ai/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SpendingInsightInput;
    const categories = Array.isArray(body.categoryLimits) ? body.categoryLimits : [];
    const currentCycleSpending = Array.isArray(body.currentCycleSpending) ? body.currentCycleSpending : [];
    const previousCycleData = Array.isArray(body.previousCycleData) ? body.previousCycleData : [];
    const fallback = fallbackSpendingInsight(currentCycleSpending, categories, previousCycleData);

    const groq = await callGroqJson<Partial<SpendingInsightResult>>({
      fallback,
      maxTokens: 500,
      messages: [
        {
          role: "system",
          content: [
            "You write one basic budgeting insight for a spending app.",
            "This is a free basic insight, not premium deep behavioral analysis.",
            "Return JSON with title, message, tone, and supportingMetric.",
            "Tone must be positive, neutral, or watch.",
            AI_TONE_INSTRUCTIONS
          ].join(" ")
        },
        {
          role: "user",
          content: JSON.stringify({
            currentCycleSpending: currentCycleSpending.slice(0, 80),
            categoryLimits: categories.map((category) => ({ id: category.id, name: category.name, limit: category.limit })),
            previousCycleData: previousCycleData.slice(0, 80)
          })
        }
      ]
    });

    return NextResponse.json(normalizeSpendingInsight(groq.data, fallback));
  } catch {
    return NextResponse.json({
      title: "Spending snapshot",
      message: "Your basic spending summary is available after purchases are added.",
      tone: "neutral",
      supportingMetric: null
    } satisfies SpendingInsightResult);
  }
}

function fallbackSpendingInsight(
  currentCycleSpending: SpendingInsightInput["currentCycleSpending"],
  categories: AiCategory[],
  previousCycleData: SpendingInsightInput["previousCycleData"] = []
): SpendingInsightResult {
  const total = roundMoney(currentCycleSpending.reduce((sum, purchase) => sum + Math.abs(Number(purchase.amount) || 0), 0));
  if (!currentCycleSpending.length) {
    return {
      title: "Ready when you start",
      message: "Add a few purchases to see a simple spending summary.",
      tone: "neutral",
      supportingMetric: null
    };
  }

  const totalsByCategory = new Map<string, number>();
  currentCycleSpending.forEach((purchase) => {
    totalsByCategory.set(purchase.categoryId, roundMoney((totalsByCategory.get(purchase.categoryId) ?? 0) + Math.abs(Number(purchase.amount) || 0)));
  });
  const watchedCategory = categories
    .map((category) => ({ category, total: totalsByCategory.get(category.id) ?? 0 }))
    .filter(({ category }) => category.limit > 0)
    .sort((a, b) => b.total / b.category.limit - a.total / a.category.limit)[0];
  const previousTotal = roundMoney((previousCycleData ?? []).reduce((sum, purchase) => sum + Math.abs(Number(purchase.amount) || 0), 0));

  if (watchedCategory && watchedCategory.total / watchedCategory.category.limit >= 0.8) {
    return {
      title: "Worth watching",
      message: `${watchedCategory.category.name} is using most of its current limit.`,
      tone: "watch",
      supportingMetric: `${Math.round((watchedCategory.total / watchedCategory.category.limit) * 100)}% used`
    };
  }

  return {
    title: "Current cycle",
    message: previousTotal ? "Your current cycle spending summary is ready for a quick review." : "Your current cycle spending is starting to take shape.",
    tone: "neutral",
    supportingMetric: `$${total.toFixed(2)} tracked`
  };
}

function normalizeSpendingInsight(parsed: Partial<SpendingInsightResult>, fallback: SpendingInsightResult): SpendingInsightResult {
  const tone = parsed.tone === "positive" || parsed.tone === "neutral" || parsed.tone === "watch" ? parsed.tone : fallback.tone;

  return {
    title: typeof parsed.title === "string" && parsed.title.trim() ? parsed.title.trim().slice(0, 60) : fallback.title,
    message: typeof parsed.message === "string" && parsed.message.trim() ? parsed.message.trim().slice(0, 180) : fallback.message,
    tone,
    supportingMetric: typeof parsed.supportingMetric === "string" && parsed.supportingMetric.trim() ? parsed.supportingMetric.trim().slice(0, 40) : fallback.supportingMetric
  };
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}
