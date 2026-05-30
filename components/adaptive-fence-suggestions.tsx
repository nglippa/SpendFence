"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronRight, Gauge, X } from "lucide-react";
import {
  IntelligenceEmptyState,
  IntelligenceSection,
  intelligenceAccentRailClass,
  intelligenceCardSurfaceClass,
  intelligenceIconSurfaceClass
} from "@/components/insights/intelligence-section";
import { PremiumBadge } from "@/components/upgrade-modal";
import { Button, Pill } from "@/components/ui";
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

const premiumIntelligenceSentence = "Premium adds deeper budget review.";

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
    state.rememberAdaptiveFenceSuggestionsView({ expandedId: null });
    onFeedback?.(applyLimit ? `${suggestion.title} applied.` : "Suggestion marked useful.");
  }

  function dismiss(suggestion: AdaptiveFenceSuggestion) {
    state.dismissAdaptiveFenceSuggestion(suggestion);
    state.rememberAdaptiveFenceSuggestionsView({ expandedId: null });
    onFeedback?.("Suggestion dismissed.");
  }

  if (!state.adaptiveFenceSettings.enabled) {
    return (
      <>
        <AdaptivePremiumNotice isPro={isPro} />
        <IntelligenceSection
          title="Budget guidance"
          tierLabel={intelligenceTierLabel(isPro)}
          onRefresh={() => generateSuggestions(true)}
          refreshDisabled
          variant="flagship"
        >
          <IntelligenceEmptyState title="Budget guidance is off." body="You can turn it back on in AI settings." />
        </IntelligenceSection>
      </>
    );
  }

  return (
    <>
      <AdaptivePremiumNotice isPro={isPro} />
      <IntelligenceSection
        title="Budget guidance"
        tierLabel={intelligenceTierLabel(isPro)}
        loading={loading}
        onRefresh={() => generateSuggestions(true)}
        refreshDisabled={loading}
        variant="flagship"
      >
        {hasVisibleSuggestions ? (
          <div className="grid gap-2.5">
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
    <p className="mb-2 px-1 text-xs font-semibold leading-5 text-[var(--app-text-secondary)]">
      {premiumIntelligenceSentence}{" "}
      <Link href="/premium" className="inline-flex align-baseline transition hover:brightness-105 focus:outline-none focus:ring-4 focus:ring-[rgb(127_151_189_/_0.16)]">
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
    <article className={cn(intelligenceCardSurfaceClass, "group p-3.5 sm:p-4")}>
      <div className={intelligenceAccentRailClass} />
      <div className="relative flex items-start gap-3 pl-1">
        <div className={intelligenceIconSurfaceClass}>
          <Gauge size={16} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-[var(--app-intelligence)]">Recommendation</p>
            <Pill className={cn("px-2 py-0 text-[0.64rem] sm:text-[0.68rem]", confidenceClass(suggestion.confidence))}>{suggestion.confidence}</Pill>
          </div>
          <h3 className="mt-1 text-sm font-black leading-5 text-[var(--app-text)] sm:text-base sm:leading-6">{suggestion.title}</h3>
          <p className="mt-1 text-sm font-black leading-5 text-[var(--app-text)]">{suggestion.suggestedAction}</p>
          {suggestion.suggestedLimit ? (
            <p className="mt-0.5 text-xs font-semibold leading-4 text-[var(--app-text-muted)]">
              Current fence {formatMoney(suggestion.currentLimit)} to {formatMoney(suggestion.suggestedLimit)}
            </p>
          ) : suggestion.metric ? (
            <p className="mt-0.5 text-xs font-semibold leading-4 text-[var(--app-text-muted)]">{suggestion.metric}</p>
          ) : null}
          <p
            className={cn(
              "text-sm font-semibold leading-5 text-[var(--app-text-secondary)] transition-[max-height,opacity] duration-200 ease-out motion-reduce:transition-none",
              expanded ? "mt-2 max-h-28 overflow-y-auto pr-1 opacity-100" : "max-h-0 overflow-hidden opacity-0"
            )}
          >
            {suggestion.explanation}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onToggle}
              className="inline-flex items-center gap-1 text-xs font-black text-[var(--app-intelligence)]"
              aria-expanded={expanded}
              aria-label={`${expanded ? "Collapse" : "Expand"} suggestion: ${suggestion.title}`}
            >
              {expanded ? "Hide details" : "Details"}
              <ChevronRight size={14} className={cn("transition-transform", expanded && "rotate-90")} />
            </button>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <Button type="button" size="sm" onClick={onAccept} variant="secondary" className="min-h-8 rounded-[0.72rem] px-2.5 text-xs sm:min-h-9">
            <Check size={14} /> {appliesLimit ? "Accept" : "Useful"}
          </Button>
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss suggestion"
            className="grid h-8 w-8 place-items-center rounded-[0.72rem] border border-[var(--glass-border)] [background:var(--glass-interactive-bg)] text-[var(--app-text-muted)] shadow-[inset_0_1px_0_var(--glass-edge)] transition hover:[background:var(--glass-focused-bg)] hover:text-[var(--app-text)] sm:h-9 sm:w-9"
          >
            <X size={15} />
          </button>
        </div>
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
    confidence === "high" && "border-[rgb(121_131_189_/_0.22)] bg-[rgb(121_131_189_/_0.12)] text-[var(--app-intelligence)] ",
    confidence === "medium" && "border-[rgb(111_143_183_/_0.22)] bg-[rgb(111_143_183_/_0.12)] text-[var(--app-info)] ",
    confidence === "low" && "border-[var(--app-border)] bg-[var(--app-card)] text-[var(--app-text-muted)]"
  );
}

function intelligenceTierLabel(isPro: boolean) {
  return isPro ? "Advanced" : "Basic";
}

function categoryName(categories: Category[], categoryId: string) {
  return categories.find((category) => category.id === categoryId)?.name ?? "this category";
}
