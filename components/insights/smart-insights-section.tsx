"use client";

import { Brain } from "lucide-react";
import { SpendInsightCard } from "@/components/insights/spend-insight-card";
import { useCenteredCarousel } from "@/components/use-centered-carousel";
import type { BehavioralInsight } from "@/lib/insights/insight-types";
import { cn } from "@/lib/utils";

export function SmartInsightsSection({ insights }: { insights: BehavioralInsight[] }) {
  const { activeIndex, carouselRef, handleScroll } = useCenteredCarousel(insights.length);

  if (!insights.length) return null;

  return (
    <section className="mb-4 sm:mb-5">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <p className="flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.16em] text-[#327d6d]">
            <Brain size={14} /> Basic intelligence
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-black tracking-tight text-[#10201c] sm:text-2xl">Smart Insights</h2>
          </div>
        </div>
        <p className="hidden max-w-xs text-right text-xs font-bold leading-5 text-slate-500 sm:block">
          Basic guidance from this cycle, prior activity, timing, merchants, and category fences.
        </p>
      </div>

      <div
        ref={carouselRef}
        data-carousel="true"
        onScroll={handleScroll}
        className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain scroll-smooth px-4 pb-2 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-3 sm:overflow-visible sm:px-0 lg:grid-cols-3 xl:grid-cols-5"
      >
        {insights.map((insight) => (
          <SpendInsightCard
            key={insight.id}
            data-carousel-item="true"
            insight={insight}
            dismissible={false}
            compact
            className="min-h-[9rem] basis-full shrink-0 snap-center snap-always shadow-none sm:min-w-0 sm:basis-auto"
          />
        ))}
      </div>
      <CarouselDots count={insights.length} activeIndex={activeIndex} />
    </section>
  );
}

function CarouselDots({ count, activeIndex }: { count: number; activeIndex: number }) {
  if (count < 2) return null;
  return (
    <div className="mt-2 flex items-center justify-center gap-1.5 sm:hidden" aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <span key={index} className={cn("h-1.5 rounded-full transition-all duration-200", index === activeIndex ? "w-5 bg-[var(--brand-primary)]" : "w-1.5 bg-[var(--app-border)]")} />
      ))}
    </div>
  );
}
