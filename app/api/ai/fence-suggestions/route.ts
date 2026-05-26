import { NextResponse } from "next/server";
import { AI_TONE_INSTRUCTIONS, callGroqJson } from "@/lib/ai/groq";
import { generateLocalFenceSuggestions, normalizeAdaptiveSuggestions, type AdaptiveFenceInput } from "@/lib/ai/adaptive-fences";
import type { AdaptiveFenceSuggestion } from "@/lib/types";

type GroqFenceSuggestionResult = {
  suggestions: Partial<AdaptiveFenceSuggestion>[];
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AdaptiveFenceInput;
    const fallback = generateLocalFenceSuggestions(body);

    if (!fallback.length) {
      return NextResponse.json({ suggestions: [], aiUsed: false });
    }

    const groq = await callGroqJson<GroqFenceSuggestionResult>({
      fallback: { suggestions: fallback },
      maxTokens: 850,
      messages: [
        {
          role: "system",
          content: [
            "You refine adaptive budget fence suggestions for SpendFence.",
            "Preserve the same categoryId, type, currentLimit, suggestedLimit, and basic action intent.",
            "Use only the provided localSuggestions and evidence. Never invent spending pressure, broad trends, or urgency.",
            "Never say a fence is tight unless the provided evidence already supports current_tight or likely_over_limit.",
            "Never make all-category or most-category claims unless the evidence explicitly covers at least 70% of categories.",
            "If evidence is weak, keep the local suggestion unchanged rather than embellishing it.",
            "Do not suggest increasing limits for low-usage categories unless the provided suggestion already includes that action.",
            "Keep suggestions optional, collaborative, calm, and brief.",
            "Do not provide financial advice or tell the user what they must do.",
            "Do not use guilt language, hype, or financial coach language.",
            "Return JSON with a suggestions array only.",
            AI_TONE_INSTRUCTIONS
          ].join(" ")
        },
        {
          role: "user",
          content: JSON.stringify({
            settings: body.settings,
            localSuggestions: fallback.map((suggestion) => ({
              id: suggestion.id,
              categoryId: suggestion.categoryId,
              type: suggestion.type,
              title: suggestion.title,
              explanation: suggestion.explanation,
              suggestedAction: suggestion.suggestedAction,
              confidence: suggestion.confidence,
              currentLimit: suggestion.currentLimit,
              suggestedLimit: suggestion.suggestedLimit,
              metric: suggestion.metric,
              evidence: suggestion.evidence
            })),
            categories: body.categories.map((category) => ({ id: category.id, name: category.name, limit: category.limit })),
            recentPurchases: body.purchases.slice(0, 60).map((purchase) => ({
              amount: purchase.amount,
              categoryId: purchase.categoryId,
              merchant: purchase.merchant,
              date: purchase.date
            })),
            recurringItems: (body.recurringItems ?? []).slice(0, 30).map((item) => ({
              name: item.name,
              amount: item.amount,
              frequency: item.frequency,
              categoryId: item.categoryId,
              active: item.active
            }))
          })
        }
      ]
    });

    return NextResponse.json({
      suggestions: normalizeAdaptiveSuggestions(groq.data.suggestions, fallback, body.categories),
      aiUsed: groq.aiUsed
    });
  } catch {
    return NextResponse.json({ suggestions: [], aiUsed: false });
  }
}
