"use client";

import { Brain } from "lucide-react";
import { SpendInsightCard } from "@/components/insights/spend-insight-card";
import type { BehavioralInsight } from "@/lib/insights/insight-types";

export function SmartInsightsSection({ insights }: { insights: BehavioralInsight[] }) {
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

      <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-3 xl:grid-cols-5">
        {insights.map((insight) => (
          <SpendInsightCard
            key={insight.id}
            insight={insight}
            dismissible={false}
            compact
            className="min-h-[9rem] min-w-[18rem] snap-start bg-white/82 shadow-none sm:min-w-0"
          />
        ))}
      </div>
    </section>
  );
}
