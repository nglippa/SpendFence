"use client";

import { useState } from "react";
import { Brain, ChevronRight } from "lucide-react";
import { IntelligenceEmptyState, IntelligenceSection, intelligenceAccentRailClass, intelligenceCardSurfaceClass, intelligenceIconSurfaceClass } from "@/components/insights/intelligence-section";
import { SpendInsightCard } from "@/components/insights/spend-insight-card";
import { useAuth } from "@/lib/auth";
import type { BehavioralInsight } from "@/lib/insights/insight-types";
import { cn } from "@/lib/utils";

export function SmartInsightsSection({ insights }: { insights: BehavioralInsight[] }) {
  const { isPro } = useAuth();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const primaryInsight = insights[0];
  const secondaryInsights = insights.slice(1, 4);
  const tierDescription = isPro
    ? "Important observations from this cycle."
    : "Cycle observations. Deeper review is included with Premium.";

  return (
    <IntelligenceSection
      title="Observations"
      tierLabel={isPro ? "Advanced" : "Basic"}
      tierIcon={Brain}
      premiumLabel={isPro ? undefined : "Premium"}
      tierDescription={tierDescription}
      onRefresh={() => setRefreshKey((current) => current + 1)}
      variant="flagship"
    >
      {primaryInsight ? (
        <div key={refreshKey} className="grid gap-2.5">
          <article className={cn(intelligenceCardSurfaceClass, "p-3.5 sm:p-4")}>
            <span className={intelligenceAccentRailClass} aria-hidden="true" />
            <div className="flex items-start gap-3 pl-1">
              <div className={intelligenceIconSurfaceClass}>
                <Brain size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-[var(--app-intelligence)]">Insight</p>
                  {primaryInsight.categoryLabel ? <ObservationChip>{primaryInsight.categoryLabel}</ObservationChip> : null}
                  {primaryInsight.supportingMetric ? <ObservationChip>{primaryInsight.supportingMetric}</ObservationChip> : null}
                </div>
                <h2 className="mt-1 text-base font-black leading-6 text-[var(--app-text)] sm:text-lg">{primaryInsight.title}</h2>
                {detailsOpen ? <p className="mt-1.5 text-sm font-semibold leading-5 text-[var(--app-text-secondary)]">{primaryInsight.message}</p> : null}
                <button
                  type="button"
                  onClick={() => setDetailsOpen((open) => !open)}
                  className="mt-2 inline-flex items-center gap-1 text-xs font-black text-[var(--app-intelligence)]"
                  aria-expanded={detailsOpen}
                >
                  {detailsOpen ? "Hide details" : "View details"}
                  <ChevronRight size={14} className={cn("transition-transform", detailsOpen && "rotate-90")} />
                </button>
              </div>
            </div>
          </article>

          {secondaryInsights.length ? (
            <>
              <button
                type="button"
                onClick={() => setMoreOpen((open) => !open)}
                className="inline-flex w-fit items-center gap-1 rounded-full border border-[rgb(121_131_189_/_0.14)] bg-[rgb(255_255_255_/_0.050)] px-2.5 py-1 text-xs font-black text-[var(--app-text-secondary)] transition hover:bg-[rgb(255_255_255_/_0.080)]"
                aria-expanded={moreOpen}
              >
                {moreOpen ? "Hide" : "Show"} {secondaryInsights.length} more
                <ChevronRight size={14} className={cn("transition-transform", moreOpen && "rotate-90")} />
              </button>
              {moreOpen ? (
                <div className="grid gap-2">
                  {secondaryInsights.map((insight) => (
                    <SpendInsightCard key={insight.id} insight={insight} dismissible={false} compact />
                  ))}
                </div>
              ) : null}
            </>
          ) : null}
        </div>
      ) : (
        <IntelligenceEmptyState title="No observations right now." body="SpendFence will surface cycle guidance as spending patterns become clearer." />
      )}
    </IntelligenceSection>
  );
}

function ObservationChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-[rgb(121_131_189_/_0.14)] bg-[rgb(121_131_189_/_0.075)] px-2 py-0.5 text-[0.66rem] font-black leading-5 text-[var(--app-text-secondary)]">
      {children}
    </span>
  );
}
