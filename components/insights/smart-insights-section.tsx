"use client";

import { useState } from "react";
import { Brain } from "lucide-react";
import { IntelligenceCarouselDots, IntelligenceEmptyState, IntelligenceSection, intelligenceCarouselTrackClass } from "@/components/insights/intelligence-section";
import { SpendInsightCard } from "@/components/insights/spend-insight-card";
import { useCenteredCarousel } from "@/components/use-centered-carousel";
import { useAuth } from "@/lib/auth";
import type { BehavioralInsight } from "@/lib/insights/insight-types";

export function SmartInsightsSection({ insights }: { insights: BehavioralInsight[] }) {
  const { isPro } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const { activeIndex, carouselRef, handleScroll } = useCenteredCarousel(insights.length);
  const tierDescription = isPro
    ? "Advanced pattern recognition and deeper insights are active."
    : "Upgrade for advanced pattern recognition and deeper insight review. Advanced analytics and deeper insights included with Premium.";

  return (
    <IntelligenceSection
      title="Smart Insights"
      tierLabel={isPro ? "Advanced Intelligence" : "Basic Intelligence"}
      tierIcon={Brain}
      premiumLabel={isPro ? undefined : "Premium"}
      tierDescription={tierDescription}
      onRefresh={() => setRefreshKey((current) => current + 1)}
      dots={<IntelligenceCarouselDots count={insights.length} activeIndex={activeIndex} />}
      variant="flagship"
    >
      {insights.length ? (
        <div
          key={refreshKey}
          ref={carouselRef}
          data-carousel="true"
          onScroll={handleScroll}
          className={intelligenceCarouselTrackClass}
        >
          {insights.map((insight) => (
            <SpendInsightCard
              key={insight.id}
              data-carousel-item="true"
              insight={insight}
              dismissible={false}
              compact
              className="app-carousel-card min-h-[15.5rem] shrink-0 snap-center snap-always sm:min-h-[16rem]"
            />
          ))}
        </div>
      ) : (
        <IntelligenceEmptyState title="No smart insights right now." body="SpendFence will surface cycle guidance as spending patterns become clearer." />
      )}
    </IntelligenceSection>
  );
}
