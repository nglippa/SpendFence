"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Brain, Check, ChevronRight, Gauge, RefreshCw, Sparkles, X } from "lucide-react";
import { Button, Card, Pill } from "@/components/ui";
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
      <Card className="overflow-hidden p-0">
        <SectionHeader loading={false} aiUsed={false} onRefresh={() => generateSuggestions(true)} refreshDisabled />
        <p className="px-4 pb-4 text-sm font-semibold text-[var(--app-text-muted)] sm:px-5">
          Adaptive Suggestions are off. You can turn them back on in AI settings.
        </p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden p-0">
      <SectionHeader loading={loading} aiUsed={cache.aiUsed} onRefresh={() => generateSuggestions(true)} refreshDisabled={loading} />
      {hasVisibleSuggestions ? (
        <>
          <div
            ref={carouselRef}
            data-carousel="true"
            onScroll={handleScroll}
            className="flex min-h-[16rem] snap-x snap-mandatory items-stretch gap-3 overflow-x-auto overscroll-x-contain scroll-smooth px-3 pb-3 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-5 sm:px-5 sm:pb-4"
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
          <CarouselDots count={activeSuggestions.length} activeIndex={activeIndex} className="pb-3 sm:pb-4" />
        </>
      ) : (
        <div className="grid min-h-[17.875rem] content-start px-4 pb-4 sm:px-5">
          <div className="rounded-2xl border border-dashed border-[var(--app-border)] bg-[var(--app-secondary)] p-3">
            <p className="text-sm font-black text-[var(--app-text)]">{loading ? "Refreshing suggestions..." : "No fence changes suggested right now."}</p>
            <p className="mt-1 text-xs font-semibold leading-5 text-[var(--app-text-muted)]">
              {loading ? "SpendFence is checking your latest budget rhythm." : "SpendFence will surface small adjustments as category patterns become steadier."}
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}

function SectionHeader({
  loading,
  aiUsed,
  onRefresh,
  refreshDisabled
}: {
  loading: boolean;
  aiUsed: boolean;
  onRefresh: () => void;
  refreshDisabled?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-2 px-3 pb-2.5 pt-3 sm:gap-3 sm:px-5 sm:pb-3 sm:pt-5">
      <div className="min-w-0">
        <p className="flex items-center gap-1 text-[0.68rem] font-black uppercase tracking-[0.13em] text-[var(--brand-primary)] sm:gap-1.5 sm:text-xs sm:tracking-[0.16em]">
          <Sparkles size={12} className="sm:h-3.5 sm:w-3.5" /> Fence Insights
        </p>
        <h2 className="mt-0.5 truncate text-base font-black text-[var(--app-text)] sm:mt-1 sm:text-xl">Adaptive Suggestions</h2>
      </div>
      <div className="flex shrink-0 flex-wrap justify-end gap-1">
        <Pill className="border-[rgb(46_211_183_/_0.25)] bg-[rgb(46_211_183_/_0.1)] px-1.5 py-0 text-[0.64rem] text-[var(--brand-primary)] sm:px-2 sm:text-xs">
          <Brain size={10} className="mr-0.5 sm:mr-1 sm:h-3 sm:w-3" /> {aiUsed ? "AI" : "Local"}
        </Pill>
        {loading ? <Pill className="border-[var(--app-border)] bg-[var(--app-secondary)] px-1.5 py-0 text-[0.64rem] text-[var(--app-text-muted)] sm:px-2 sm:text-xs">Updating</Pill> : null}
        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshDisabled}
          className="inline-flex h-6 items-center gap-1 rounded-full border border-[var(--app-border)] bg-[var(--app-card)] px-2 text-[0.64rem] font-black text-[var(--app-text-muted)] transition hover:text-[var(--brand-primary)] disabled:cursor-not-allowed disabled:opacity-50 sm:h-7 sm:text-xs"
        >
          <RefreshCw size={10} className={cn("sm:h-3 sm:w-3", loading && "animate-spin")} />
          Refresh
        </button>
      </div>
    </div>
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
    <article data-carousel-item="true" className="flex h-[15rem] basis-full shrink-0 snap-center snap-always flex-col self-stretch rounded-2xl border border-[var(--app-border)] bg-[var(--app-secondary)] p-2.5 transition-[box-shadow,opacity] duration-200 ease-out sm:h-[15.5rem] sm:p-3">
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
        <span className="min-w-0 truncate text-xs font-black text-[var(--app-text)] sm:text-sm">{suggestion.suggestedAction}</span>
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

function CarouselDots({ count, activeIndex, className }: { count: number; activeIndex: number; className?: string }) {
  if (count < 2) return null;
  return (
    <div className={cn("flex items-center justify-center gap-1.5", className)} aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <span key={index} className={cn("h-1.5 rounded-full transition-all duration-200", index === activeIndex ? "w-5 bg-[var(--brand-primary)]" : "w-1.5 bg-[var(--app-border)]")} />
      ))}
    </div>
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

function categoryName(categories: Category[], categoryId: string) {
  return categories.find((category) => category.id === categoryId)?.name ?? "this category";
}
