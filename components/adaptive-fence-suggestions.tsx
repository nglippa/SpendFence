"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronRight, Gauge, X } from "lucide-react";
import {
  IntelligenceCarouselDots,
  IntelligenceEmptyState,
  IntelligenceSection,
  intelligenceAccentRailClass,
  intelligenceCardSurfaceClass,
  intelligenceCarouselTrackClass,
  intelligenceIconSurfaceClass
} from "@/components/insights/intelligence-section";
import { PremiumBadge } from "@/components/upgrade-modal";
import { Button, Pill } from "@/components/ui";
import { useCenteredCarousel } from "@/components/use-centered-carousel";
import { buildAdaptiveSuggestionFingerprint } from "@/lib/adaptive-suggestions-engine";
import { generateLocalFenceSuggestions } from "@/lib/ai/adaptive-fences";
import { useAuth } from "@/lib/auth";
import { formatMoney } from "@/lib/budget";
import { useSpendFence } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { AdaptiveAutomationLevel, AdaptiveFenceSuggestion, Category } from "@/lib/types";

type SuggestionResponse = {
  suggestions?: AdaptiveFenceSuggestion[];
  aiUsed?: boolean;
};

const premiumIntelligenceSentence = "Advanced analytics and deeper insights included with Premium.";

export function AdaptiveFenceSuggestions({ onFeedback }: { onFeedback?: (message: string) => void }) {
  const state = useSpendFence();
  const auth = useAuth();
  const { isPro } = auth;
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
      learningEvents: state.fenceLearningEvents,
      spendingRules: state.spendingRules
    }),
    [state.adaptiveFenceSettings, state.budgetMonth, state.categories, state.fenceLearningEvents, state.purchases, state.recurringItems, state.spendingRules]
  );

  const fingerprint = useMemo(
    () =>
      buildAdaptiveSuggestionFingerprint({
        categories: state.categories,
        purchases: state.purchases,
        recurringItems: state.recurringItems,
        budgetMonth: state.budgetMonth,
        settings: state.adaptiveFenceSettings,
        spendingRules: state.spendingRules
      }),
    [state.adaptiveFenceSettings, state.budgetMonth, state.categories, state.purchases, state.recurringItems, state.spendingRules]
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
        const token = await auth.getAccessToken();
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (token) headers.Authorization = `Bearer ${token}`;
        if (auth.isDeveloper) headers["x-spendfence-dev-tier-preview"] = auth.tierPreviewMode;
        if (auth.user?.email) headers["x-spendfence-dev-email"] = auth.user.email;
        headers["x-spendfence-real-tier"] = auth.realTier;
        if (process.env.NODE_ENV === "development" && auth.user?.id) headers["x-spendfence-dev-user"] = auth.user.id;

        const response = await fetch("/api/ai/fence-suggestions", {
          method: "POST",
          headers,
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
    [auth, cache.fingerprint, cache.generatedAt, fingerprint, hasVisibleSuggestions, requestBody, state]
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
            settings: state.adaptiveFenceSettings,
            spendingRules: state.spendingRules
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
      <>
        <AdaptivePremiumNotice isPro={isPro} />
        <IntelligenceSection
          title="Adaptive Fences"
          tierLabel={intelligenceTierLabel(isPro)}
          onRefresh={() => generateSuggestions(true)}
          refreshDisabled
          variant="flagship"
        >
          <IntelligenceEmptyState title="Adaptive Fences are off." body="You can turn them back on in AI settings." />
        </IntelligenceSection>
      </>
    );
  }

  return (
    <>
      <AdaptivePremiumNotice isPro={isPro} />
      <IntelligenceSection
        title="Adaptive Fences"
        tierLabel={intelligenceTierLabel(isPro)}
        loading={loading}
        onRefresh={() => generateSuggestions(true)}
        refreshDisabled={loading}
        dots={<IntelligenceCarouselDots count={activeSuggestions.length} activeIndex={activeIndex} />}
        variant="flagship"
      >
        {hasVisibleSuggestions ? (
          <div
            ref={carouselRef}
            data-carousel="true"
            onScroll={handleScroll}
            className={intelligenceCarouselTrackClass}
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
          <AdaptiveEmptyState
            title={loading ? "Refreshing suggestions..." : "No fence changes suggested right now."}
            body={loading ? "SpendFence is checking your latest budget rhythm." : "SpendFence will surface adjustments when patterns become meaningful."}
            loading={loading}
          />
        )}
      </IntelligenceSection>
    </>
  );
}

function AdaptivePremiumNotice({ isPro }: { isPro: boolean }) {
  if (isPro) return null;

  return (
    <p className="mb-2.5 px-1 text-xs font-bold leading-5 text-[#475569] dark:text-[#C9D4E4] sm:mb-3 sm:px-1.5">
      {premiumIntelligenceSentence}{" "}
      <Link href="/premium" className="inline-flex align-baseline transition hover:brightness-105 focus:outline-none focus:ring-4 focus:ring-[rgb(75_140_255_/_0.16)]">
        <PremiumBadge />
      </Link>
    </p>
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
    <article
      data-carousel-item="true"
      className={cn(intelligenceCardSurfaceClass, "app-carousel-card group flex min-h-[15.5rem] shrink-0 snap-center snap-always flex-col self-stretch p-3.5 sm:min-h-[16rem] sm:p-4")}
    >
      <div className={intelligenceAccentRailClass} />
      <div className="pointer-events-none absolute -right-16 -top-16 h-32 w-32 rounded-full bg-[rgb(99_102_241_/_0.14)] blur-2xl transition-opacity duration-300 group-hover:opacity-100" />
      <button type="button" onClick={onToggle} className="relative block w-full text-left" aria-expanded={expanded} aria-label={`${expanded ? "Collapse" : "Expand"} suggestion: ${suggestion.title}`}>
        <div className="mb-2 flex items-start justify-between gap-2 sm:mb-3 sm:gap-3">
          <div className={intelligenceIconSurfaceClass}>
            <Gauge size={16} />
          </div>
          <Pill className={cn("px-2 py-0.5 text-[0.64rem] shadow-[0_8px_18px_rgb(11_17_20_/_0.06)] sm:text-xs", confidenceClass(suggestion.confidence))}>{suggestion.confidence}</Pill>
        </div>
        <h3 className="text-[0.95rem] font-black leading-5 text-[#0B1114] dark:text-[var(--app-text)] sm:text-[1.05rem] sm:leading-6">{suggestion.title}</h3>
        <div>
          <p
            className={cn(
              "mt-1.5 text-xs font-bold leading-5 text-[#475569] transition-[max-height,opacity] duration-200 ease-out motion-reduce:transition-none dark:text-[#C9D4E4] sm:text-sm sm:leading-6",
              expanded ? "max-h-24 overflow-y-auto pr-1" : "line-clamp-2 min-h-[2.5rem] max-h-[2.5rem] overflow-hidden sm:line-clamp-3 sm:min-h-[3.75rem] sm:max-h-[3.75rem]"
            )}
          >
            {suggestion.explanation}
          </p>
        </div>
        <span className="mt-2 inline-flex text-xs font-black text-[#4F46E5] dark:text-[#C4B5FD]">{expanded ? "Show less" : "Read more"}</span>
      </button>
      <div className="relative mt-3 flex items-center justify-between gap-2 rounded-2xl border border-[rgb(99_102_241_/_0.14)] bg-white/78 px-2.5 py-2 shadow-[inset_0_1px_0_rgb(255_255_255_/_0.85)] dark:border-white/10 dark:bg-white/[0.055] sm:px-3 sm:py-2.5">
        <span className="min-w-0 text-xs font-black leading-4 text-[#10201c] dark:text-[var(--app-text)] sm:text-sm sm:leading-5">{suggestion.suggestedAction}</span>
        {suggestion.metric ? <span className="shrink-0 text-[0.68rem] font-black text-[var(--app-text-muted)] sm:text-xs">{suggestion.metric}</span> : <ChevronRight size={15} className="shrink-0 text-[var(--app-text-muted)]" />}
      </div>
      {suggestion.suggestedLimit ? (
        <p className="mt-1.5 text-[0.68rem] font-bold leading-4 text-[var(--app-text-muted)] sm:mt-2 sm:text-xs">
          Current fence {formatMoney(suggestion.currentLimit)} → {formatMoney(suggestion.suggestedLimit)}
        </p>
      ) : null}
      <div className="mt-auto grid grid-cols-[1fr_auto] gap-2 pt-2 sm:pt-3">
        <Button type="button" size="sm" onClick={onAccept} className="min-h-9 rounded-xl bg-[linear-gradient(135deg,#1E1B4B,#4F46E5_52%,#7C3AED)] px-2.5 text-xs text-white shadow-[0_10px_24px_rgb(79_70_229_/_0.20)] hover:brightness-105 dark:text-white sm:min-h-10 sm:px-3">
          <Check size={14} /> {appliesLimit ? "Accept" : "Useful"}
        </Button>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss suggestion"
          className="grid h-9 w-9 place-items-center rounded-xl border border-white/80 bg-white/80 text-[var(--app-text-muted)] shadow-[0_8px_18px_rgb(11_17_20_/_0.06)] transition hover:bg-white hover:text-[var(--app-text)] dark:border-white/10 dark:bg-white/[0.06] sm:h-10 sm:w-10"
        >
          <X size={15} />
        </button>
      </div>
    </article>
  );
}

function AdaptiveEmptyState({ title, body, loading }: { title: string; body: string; loading: boolean }) {
  return <IntelligenceEmptyState title={title} body={body} loading={loading} />;
}

function confidenceClass(confidence: AdaptiveFenceSuggestion["confidence"]) {
  return cn(
    "capitalize",
    confidence === "high" && "border-[rgb(99_102_241_/_0.25)] bg-[rgb(99_102_241_/_0.11)] text-[#4F46E5] dark:text-[#C4B5FD]",
    confidence === "medium" && "border-[rgb(59_130_246_/_0.24)] bg-[rgb(59_130_246_/_0.10)] text-[#2563EB] dark:text-[#93C5FD]",
    confidence === "low" && "border-[var(--app-border)] bg-[var(--app-card)] text-[var(--app-text-muted)]"
  );
}

function intelligenceTierLabel(isPro: boolean) {
  return isPro ? "Advanced Intelligence" : "Basic Intelligence";
}

function categoryName(categories: Category[], categoryId: string) {
  return categories.find((category) => category.id === categoryId)?.name ?? "this category";
}
