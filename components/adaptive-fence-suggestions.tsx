"use client";

import { useEffect, useMemo, useState } from "react";
import { Brain, Check, ChevronRight, Gauge, Sparkles, X } from "lucide-react";
import { Button, Card, Pill } from "@/components/ui";
import { generateLocalFenceSuggestions } from "@/lib/ai/adaptive-fences";
import { formatMoney } from "@/lib/budget";
import { useSpendFence } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { AdaptiveAutomationLevel, AdaptiveFenceSuggestion } from "@/lib/types";

type SuggestionResponse = {
  suggestions?: AdaptiveFenceSuggestion[];
  aiUsed?: boolean;
};

export function AdaptiveFenceSuggestions({ onFeedback }: { onFeedback?: (message: string) => void }) {
  const state = useSpendFence();
  const [suggestions, setSuggestions] = useState<AdaptiveFenceSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [aiUsed, setAiUsed] = useState(false);

  const requestBody = useMemo(
    () => ({
      categories: state.categories,
      purchases: state.purchases,
      recurringItems: state.recurringItems,
      budgetMonth: state.budgetMonth,
      settings: state.adaptiveFenceSettings,
      learningEvents: state.fenceLearningEvents
    }),
    [state.adaptiveFenceSettings, state.budgetMonth, state.categories, state.fenceLearningEvents, state.purchases, state.recurringItems]
  );

  useEffect(() => {
    if (!state.adaptiveFenceSettings.enabled) {
      setSuggestions([]);
      return;
    }

    let cancelled = false;
    async function loadSuggestions() {
      setLoading(true);
      try {
        const response = await fetch("/api/ai/fence-suggestions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody)
        });
        const data = (await response.json()) as SuggestionResponse;
        if (cancelled) return;
        setSuggestions(data.suggestions ?? []);
        setAiUsed(Boolean(data.aiUsed));
      } catch {
        if (cancelled) return;
        setSuggestions(generateLocalFenceSuggestions(requestBody));
        setAiUsed(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadSuggestions();
    return () => {
      cancelled = true;
    };
  }, [requestBody, state.adaptiveFenceSettings.enabled]);

  function accept(suggestion: AdaptiveFenceSuggestion) {
    const canApplyLimit = state.adaptiveFenceSettings.automationLevel !== "suggestions-only" && Boolean(suggestion.suggestedLimit);
    state.acceptAdaptiveFenceSuggestion(canApplyLimit ? suggestion : { ...suggestion, suggestedLimit: undefined });
    setSuggestions((current) => current.filter((item) => item.id !== suggestion.id));
    onFeedback?.(canApplyLimit ? `${suggestion.title} applied.` : "Suggestion marked useful.");
  }

  function dismiss(suggestion: AdaptiveFenceSuggestion) {
    state.dismissAdaptiveFenceSuggestion(suggestion);
    setSuggestions((current) => current.filter((item) => item.id !== suggestion.id));
    onFeedback?.("Suggestion dismissed.");
  }

  if (!state.adaptiveFenceSettings.enabled) {
    return (
      <Card className="overflow-hidden p-0">
        <SectionHeader loading={false} aiUsed={false} />
        <p className="px-4 pb-4 text-sm font-semibold text-[var(--app-text-muted)] sm:px-5">
          Adaptive Suggestions are off. You can turn them back on in AI settings.
        </p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden p-0">
      <SectionHeader loading={loading} aiUsed={aiUsed} />
      {suggestions.length ? (
        <div className="flex snap-x gap-3 overflow-x-auto px-4 pb-4 [-webkit-overflow-scrolling:touch] sm:px-5">
          {suggestions.map((suggestion) => (
            <SuggestionCard
              key={suggestion.id}
              suggestion={suggestion}
              automationLevel={state.adaptiveFenceSettings.automationLevel}
              onAccept={() => accept(suggestion)}
              onDismiss={() => dismiss(suggestion)}
            />
          ))}
        </div>
      ) : (
        <div className="px-4 pb-4 sm:px-5">
          <div className="rounded-2xl border border-dashed border-[var(--app-border)] bg-[var(--app-secondary)] p-3">
            <p className="text-sm font-black text-[var(--app-text)]">No fence changes suggested right now.</p>
            <p className="mt-1 text-xs font-semibold leading-5 text-[var(--app-text-muted)]">
              SpendFence will surface small adjustments as category patterns become steadier.
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}

function SectionHeader({ loading, aiUsed }: { loading: boolean; aiUsed: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3 px-4 pb-3 pt-4 sm:px-5 sm:pt-5">
      <div>
        <p className="flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.16em] text-[var(--brand-primary)]">
          <Sparkles size={14} /> Fence Insights
        </p>
        <h2 className="mt-1 text-lg font-black text-[var(--app-text)] sm:text-xl">Adaptive Suggestions</h2>
      </div>
      <div className="flex flex-wrap justify-end gap-1.5">
        <Pill className="border-[rgb(46_211_183_/_0.25)] bg-[rgb(46_211_183_/_0.1)] text-[var(--brand-primary)]">
          <Brain size={12} className="mr-1" /> {aiUsed ? "AI" : "Local"}
        </Pill>
        {loading ? <Pill className="border-[var(--app-border)] bg-[var(--app-secondary)] text-[var(--app-text-muted)]">Updating</Pill> : null}
      </div>
    </div>
  );
}

function SuggestionCard({
  suggestion,
  automationLevel,
  onAccept,
  onDismiss
}: {
  suggestion: AdaptiveFenceSuggestion;
  automationLevel: AdaptiveAutomationLevel;
  onAccept: () => void;
  onDismiss: () => void;
}) {
  const appliesLimit = automationLevel !== "suggestions-only" && Boolean(suggestion.suggestedLimit);

  return (
    <article className="min-w-[17.5rem] max-w-[17.5rem] snap-start rounded-2xl border border-[var(--app-border)] bg-[var(--app-secondary)] p-3 sm:min-w-[20rem] sm:max-w-[20rem]">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-gradient text-white dark:text-[#0B1114]">
          <Gauge size={18} />
        </div>
        <Pill className={confidenceClass(suggestion.confidence)}>{suggestion.confidence}</Pill>
      </div>
      <h3 className="text-base font-black leading-5 text-[var(--app-text)]">{suggestion.title}</h3>
      <p className="mt-2 line-clamp-3 min-h-[3.75rem] text-sm font-semibold leading-5 text-[var(--app-text-secondary)]">{suggestion.explanation}</p>
      <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-[var(--app-card)] px-3 py-2">
        <span className="min-w-0 text-sm font-black text-[var(--app-text)]">{suggestion.suggestedAction}</span>
        {suggestion.metric ? <span className="shrink-0 text-xs font-black text-[var(--app-text-muted)]">{suggestion.metric}</span> : <ChevronRight size={16} className="shrink-0 text-[var(--app-text-muted)]" />}
      </div>
      {suggestion.suggestedLimit ? (
        <p className="mt-2 text-xs font-bold text-[var(--app-text-muted)]">
          Current fence {formatMoney(suggestion.currentLimit)} → {formatMoney(suggestion.suggestedLimit)}
        </p>
      ) : null}
      <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
        <Button type="button" size="sm" onClick={onAccept} className="min-h-10 rounded-xl">
          <Check size={15} /> {appliesLimit ? "Accept" : "Useful"}
        </Button>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss suggestion"
          className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--app-card)] text-[var(--app-text-muted)] transition hover:bg-[var(--app-border)]"
        >
          <X size={16} />
        </button>
      </div>
    </article>
  );
}

function confidenceClass(confidence: AdaptiveFenceSuggestion["confidence"]) {
  return cn(
    "capitalize",
    confidence === "high" && "border-[rgb(31_209_165_/_0.25)] bg-[rgb(31_209_165_/_0.12)] text-[var(--app-success)]",
    confidence === "medium" && "border-[rgb(245_185_66_/_0.25)] bg-[rgb(245_185_66_/_0.13)] text-[var(--app-warning)]",
    confidence === "low" && "border-[var(--app-border)] bg-[var(--app-card)] text-[var(--app-text-muted)]"
  );
}
