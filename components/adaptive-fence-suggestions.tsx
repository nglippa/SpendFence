"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronRight, Gauge, X } from "lucide-react";
import { IntelligenceCarouselDots, IntelligenceEmptyState, IntelligenceSection, intelligenceCardSurfaceClass } from "@/components/insights/intelligence-section";
import { Button, Pill } from "@/components/ui";
import { useCenteredCarousel } from "@/components/use-centered-carousel";
import { buildAdaptiveSuggestionFingerprint } from "@/lib/adaptive-suggestions-engine";
import { generateLocalFenceSuggestions } from "@/lib/ai/adaptive-fences";
import { formatMoney } from "@/lib/budget";
import { useSpendFence } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { AdaptiveAutomationLevel, AdaptiveFenceSuggestion, Category } from "@/lib/types";

type SuggestionResponse = {
  suggestions?: AdaptiveFenceSuggestion[];
  aiUsed?: boolean;
};

export function AdaptiveFenceSuggestions({ onFeedback }: { onFeedback?: (message: string) => void }) {
  const state = useSpendFence();
  const [loading, setLoading] = useState(false);
  const generatingFingerprintRef = useRef<string | null>(null);
  const cache = state.adaptiveSuggestions;

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

  const fingerprint = useMemo(
    () =>
      buildAdaptiveSuggestionFingerprint({
        categories: state.categories,
        purchases: state.purchases,
        recurringItems: state.recurringItems,
        budgetMonth: state.budgetMonth,
        settings: state.adaptiveFenceSettings
      }),
    [state.adaptiveFenceSettings, state.budgetMonth, state.categories, state.purchases, state.recurringItems]
  );

  const activeSuggestions = useMemo(() => cache.items.filter((suggestion) => suggestion.status === "active"), [cache.items]);
  const expandedId = activeSuggestions.some((suggestion) => suggestion.id === cache.expandedId) ? cache.expandedId : null;
  const hasVisibleSuggestions = activeSuggestions.length > 0;
  const rememberView = state.rememberAdaptiveFenceSuggestionsView;
  const handleActiveIndexChange = useCallback((index: number) => rememberView({ activeIndex: index }), [rememberView]);
  const { activeIndex, carouselRef, handleScroll } = useCenteredCarousel(activeSuggestions.length, {
    initialIndex: cache.activeIndex,
    onActiveIndexChange: handleActiveIndexChange
  });

  const generateSuggestions = useCallback(
    async (manual = false) => {
      if (!state.adaptiveFenceSettings.enabled) return;
      if (!manual && cache.generatedAt && cache.fingerprint === fingerprint) return;
      if (generatingFingerprintRef.current === fingerprint) return;

      generatingFingerprintRef.current = fingerprint;
      const shouldShowLoading = manual || !cache.generatedAt || !hasVisibleSuggestions;
      if (shouldShowLoading) setLoading(true);

      try {
        const response = await fetch("/api/ai/fence-suggestions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody)
        });
        const data = (await response.json()) as SuggestionResponse;
        state.setAdaptiveFenceSuggestions({
          fingerprint,
          suggestions: data.suggestions ?? [],
          aiUsed: Boolean(data.aiUsed)
        });
      } catch {
        state.setAdaptiveFenceSuggestions({
          fingerprint,
          suggestions: generateLocalFenceSuggestions(requestBody),
          aiUsed: false
        });
      } finally {
        generatingFingerprintRef.current = null;
        if (shouldShowLoading) setLoading(false);
      }
    },
    [cache.fingerprint, cache.generatedAt, fingerprint, hasVisibleSuggestions, requestBody, state]
  );

  useEffect(() => {
    if (!state.ready || !state.adaptiveFenceSettings.enabled) return;
    if (cache.generatedAt && cache.fingerprint === fingerprint) return;
    generateSuggestions(false);
  }, [cache.fingerprint, cache.generatedAt, fingerprint, generateSuggestions, state.adaptiveFenceSettings.enabled, state.ready]);

  function accept(suggestion: AdaptiveFenceSuggestion) {
    const canApplyLimit = state.adaptiveFenceSettings.automationLevel !== "suggestions-only" && Boolean(suggestion.suggestedLimit);
    const applyLimit =
      canApplyLimit &&
      window.confirm(`Apply this suggested fence change for ${categoryName(state.categories, suggestion.categoryId)}?`);
    const nextFingerprint =
      applyLimit && suggestion.suggestedLimit
        ? buildAdaptiveSuggestionFingerprint({
            categories: state.categories.map((category) => (category.id === suggestion.categoryId ? { ...category, limit: suggestion.suggestedLimit ?? category.limit } : category)),
            purchases: state.purchases,
            recurringItems: state.recurringItems,
            budgetMonth: state.budgetMonth,
            settings: state.adaptiveFenceSettings
          })
        : undefined;

    state.acceptAdaptiveFenceSuggestion(suggestion, { applyLimit, nextFingerprint });
    state.rememberAdaptiveFenceSuggestionsView({ expandedId: null, activeIndex: Math.max(0, activeIndex - 1) });
    onFeedback?.(applyLimit ? `${suggestion.title} applied.` : "Suggestion marked useful.");
  }

  function dismiss(suggestion: AdaptiveFenceSuggestion) {
    state.dismissAdaptiveFenceSuggestion(suggestion);
    state.rememberAdaptiveFenceSuggestionsView({ expandedId: null, activeIndex: Math.max(0, activeIndex - 1) });
    onFeedback?.("Suggestion dismissed.");
  }

  if (!state.adaptiveFenceSettings.enabled) {
    return (
      <IntelligenceSection title="Adaptive Fences" tierLabel="Advanced Intelligence" sourceLabel="Local" onRefresh={() => generateSuggestions(true)} refreshDisabled>
        <IntelligenceEmptyState title="Adaptive Fences are off." body="You can turn them back on in AI settings." />
      </IntelligenceSection>
    );
  }

  return (
    <IntelligenceSection
      title="Adaptive Fences"
      tierLabel={adaptiveTierLabel(state.adaptiveFenceSettings.automationLevel)}
      sourceLabel={cache.aiUsed ? "AI" : "Local"}
      premiumLabel={state.adaptiveFenceSettings.automationLevel === "auto-apply-low-risk" ? "Premium" : undefined}
      loading={loading}
      onRefresh={() => generateSuggestions(true)}
      refreshDisabled={loading}
      dots={<IntelligenceCarouselDots count={activeSuggestions.length} activeIndex={activeIndex} />}
    >
      {hasVisibleSuggestions ? (
        <div
          ref={carouselRef}
          data-carousel="true"
          onScroll={handleScroll}
          className="flex snap-x snap-mandatory items-stretch gap-3 overflow-x-auto overscroll-x-contain scroll-smooth px-3 py-3 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-5 sm:px-5 sm:py-4"
        >
          {activeSuggestions.map((suggestion) => (
            <SuggestionCard
              key={suggestion.id}
              suggestion={suggestion}
              automationLevel={state.adaptiveFenceSettings.automationLevel}
              expanded={expandedId === suggestion.id}
              onToggle={() => state.rememberAdaptiveFenceSuggestionsView({ expandedId: expandedId === suggestion.id ? null : suggestion.id })}
              onAccept={() => accept(suggestion)}
              onDismiss={() => dismiss(suggestion)}
            />
          ))}
        </div>
      ) : (
        <IntelligenceEmptyState
          title={loading ? "Refreshing suggestions..." : "No fence changes suggested right now."}
          body={loading ? "SpendFence is checking your latest budget rhythm." : "SpendFence will surface small adjustments as patterns become steadier."}
        />
      )}
    </IntelligenceSection>
  );
}

function SuggestionCard({
  suggestion,
  automationLevel,
  expanded,
  onToggle,
  onAccept,
  onDismiss
}: {
  suggestion: AdaptiveFenceSuggestion;
  automationLevel: AdaptiveAutomationLevel;
  expanded: boolean;
  onToggle: () => void;
  onAccept: () => void;
  onDismiss: () => void;
}) {
  const appliesLimit = automationLevel !== "suggestions-only" && Boolean(suggestion.suggestedLimit);

  return (
    <article data-carousel-item="true" className={cn(intelligenceCardSurfaceClass, "app-carousel-card flex min-h-[15rem] shrink-0 snap-center snap-always flex-col self-stretch sm:min-h-[15.5rem]")}>
      <button type="button" onClick={onToggle} className="block w-full text-left" aria-expanded={expanded} aria-label={`${expanded ? "Collapse" : "Expand"} suggestion: ${suggestion.title}`}>
        <div className="mb-2 flex items-start justify-between gap-2 sm:mb-3 sm:gap-3">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-brand-gradient text-white dark:text-[#0B1114] sm:h-9 sm:w-9">
            <Gauge size={16} />
          </div>
          <Pill className={cn("px-1.5 py-0 text-[0.64rem] sm:px-2 sm:text-xs", confidenceClass(suggestion.confidence))}>{suggestion.confidence}</Pill>
        </div>
        <h3 className="text-[0.92rem] font-black leading-5 text-[var(--app-text)] sm:text-base">{suggestion.title}</h3>
        <div>
          <p
            className={cn(
              "mt-1.5 text-xs font-semibold leading-5 text-[var(--app-text-secondary)] transition-[max-height,opacity] duration-200 ease-out motion-reduce:transition-none sm:text-sm",
              expanded ? "max-h-24 overflow-y-auto pr-1" : "line-clamp-2 min-h-[2.5rem] max-h-[2.5rem] overflow-hidden sm:line-clamp-3 sm:min-h-[3.75rem] sm:max-h-[3.75rem]"
            )}
          >
            {suggestion.explanation}
          </p>
        </div>
        <span className="mt-2 inline-flex text-xs font-black text-[var(--brand-primary)]">{expanded ? "Show less" : "Read more"}</span>
      </button>
      <div className="mt-2 flex items-center justify-between gap-2 rounded-xl bg-[var(--app-card)] px-2.5 py-1.5 sm:mt-3 sm:px-3 sm:py-2">
        <span className="min-w-0 text-xs font-black leading-4 text-[var(--app-text)] sm:text-sm sm:leading-5">{suggestion.suggestedAction}</span>
        {suggestion.metric ? <span className="shrink-0 text-[0.68rem] font-black text-[var(--app-text-muted)] sm:text-xs">{suggestion.metric}</span> : <ChevronRight size={15} className="shrink-0 text-[var(--app-text-muted)]" />}
      </div>
      {suggestion.suggestedLimit ? (
        <p className="mt-1.5 text-[0.68rem] font-bold leading-4 text-[var(--app-text-muted)] sm:mt-2 sm:text-xs">
          Current fence {formatMoney(suggestion.currentLimit)} → {formatMoney(suggestion.suggestedLimit)}
        </p>
      ) : null}
      <div className="mt-auto grid grid-cols-[1fr_auto] gap-2 pt-2 sm:pt-3">
        <Button type="button" size="sm" onClick={onAccept} className="min-h-9 rounded-xl px-2.5 text-xs sm:min-h-10 sm:px-3">
          <Check size={14} /> {appliesLimit ? "Accept" : "Useful"}
        </Button>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss suggestion"
          className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--app-card)] text-[var(--app-text-muted)] transition hover:bg-[var(--app-border)] sm:h-10 sm:w-10"
        >
          <X size={15} />
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

function adaptiveTierLabel(automationLevel: AdaptiveAutomationLevel) {
  if (automationLevel === "auto-apply-low-risk") return "Premium Intelligence";
  if (automationLevel === "require-confirmation") return "Advanced Intelligence";
  return "Basic Intelligence";
}

function categoryName(categories: Category[], categoryId: string) {
  return categories.find((category) => category.id === categoryId)?.name ?? "this category";
}
