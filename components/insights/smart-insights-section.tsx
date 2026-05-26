"use client";

import { useState } from "react";
import { Brain } from "lucide-react";
import { IntelligenceCarouselDots, IntelligenceEmptyState, IntelligenceSection } from "@/components/insights/intelligence-section";
import { SpendInsightCard } from "@/components/insights/spend-insight-card";
import { useCenteredCarousel } from "@/components/use-centered-carousel";
import { useAuth } from "@/lib/auth";
import type { BehavioralInsight } from "@/lib/insights/insight-types";

export function SmartInsightsSection({ insights }: { insights: BehavioralInsight[] }) {
  const { isPro } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const { activeIndex, carouselRef, handleScroll } = useCenteredCarousel(insights.length);

  return (
    <IntelligenceSection
      title="Smart Insights"
      tierLabel={isPro ? "Advanced Intelligence" : "Basic Intelligence"}
      tierIcon={Brain}
      premiumLabel={isPro ? "Pro" : undefined}
      tierDescription={
        isPro
          ? "Advanced pattern recognition, deeper spending insights, multi-cycle analysis, and predictive fence suggestions are active."
          : "Upgrade for advanced pattern recognition and deeper insights."
      }
      onRefresh={() => setRefreshKey((current) => current + 1)}
      dots={<IntelligenceCarouselDots count={insights.length} activeIndex={activeIndex} />}
    >
      {insights.length ? (
        <div
          key={refreshKey}
          ref={carouselRef}
          data-carousel="true"
          onScroll={handleScroll}
          className="flex snap-x snap-mandatory items-stretch gap-3 overflow-x-auto overscroll-x-contain scroll-smooth px-3 py-3 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-5 sm:px-5 sm:py-4"
        >
          {insights.map((insight) => (
            <SpendInsightCard
              key={insight.id}
              data-carousel-item="true"
              insight={insight}
              dismissible={false}
              compact
              className="app-carousel-card min-h-[11.5rem] shrink-0 snap-center snap-always"
            />
          ))}
        </div>
      ) : (
        <IntelligenceEmptyState title="No smart insights right now." body="SpendFence will surface cycle guidance as spending patterns become clearer." />
      )}
    </IntelligenceSection>
  );
}
