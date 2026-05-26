"use client";

import { useEffect, useState } from "react";
import type { ComponentPropsWithoutRef } from "react";
import { Activity, AlertCircle, CheckCircle2, LineChart, ListChecks, ShieldCheck, X } from "lucide-react";
import { intelligenceCardSurfaceClass } from "@/components/insights/intelligence-section";
import type { BehavioralInsight } from "@/lib/insights/insight-types";
import { cn } from "@/lib/utils";

const iconByType = {
  positive_control: ShieldCheck,
  recovery: CheckCircle2,
  stabilization: Activity,
  gentle_caution: AlertCircle,
  spending_rule: ListChecks,
  trend: LineChart,
  empty: Activity
};

const iconStylesBySeverity = {
  calm: "bg-slate-100 text-slate-600 dark:bg-[#1D2A32] dark:text-[#A7B3BC]",
  positive: "bg-emerald-50 text-emerald-700 dark:bg-[#1D2A32] dark:text-[#1FD1A5] dark:ring-1 dark:ring-[rgb(31_209_165_/_0.18)]",
  watch: "bg-amber-50 text-amber-800 dark:bg-[#1D2A32] dark:text-[#F5B942] dark:ring-1 dark:ring-[rgb(245_185_66_/_0.18)]",
  limit: "bg-rose-50 text-rose-700 dark:bg-[#1D2A32] dark:text-[#FF6B6B] dark:ring-1 dark:ring-[rgb(255_107_107_/_0.18)]"
};

const accentBySeverity = {
  calm: "bg-[#A7B3BC]",
  positive: "bg-[#1FD1A5]",
  watch: "bg-[#F5B942]",
  limit: "bg-[#FF6B6B]"
};

export function SpendInsightCard({
  insight,
  dismissible = true,
  className,
  compact = false,
  ...articleProps
}: {
  insight?: BehavioralInsight;
  dismissible?: boolean;
  className?: string;
  compact?: boolean;
} & ComponentPropsWithoutRef<"article">) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setDismissed(insight ? window.sessionStorage.getItem(storageKey(insight.id)) === "1" : false);
  }, [insight]);

  if (!insight || dismissed) return null;

  const Icon = iconByType[insight.type];

  function dismiss() {
    if (!insight) return;
    window.sessionStorage.setItem(storageKey(insight.id), "1");
    setDismissed(true);
  }

  return (
    <article
      {...articleProps}
      className={cn(
        intelligenceCardSurfaceClass,
        "backdrop-blur hover:shadow-float",
        className
      )}
    >
      <span className={cn("absolute inset-y-0 left-0 w-1", accentBySeverity[insight.severity])} aria-hidden="true" />
      <div className="flex items-start gap-3">
        <div className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-xl", iconStylesBySeverity[insight.severity])}>
          <Icon size={17} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
            <h2 className="min-w-0 text-sm font-black leading-5 text-[#10201c] dark:text-[#F4F7F6] sm:text-base sm:leading-6">{insight.title}</h2>
            {insight.categoryLabel ? <InsightChip>{insight.categoryLabel}</InsightChip> : null}
            {insight.supportingMetric ? <InsightChip>{insight.supportingMetric}</InsightChip> : null}
          </div>
          <p className="mt-1 text-sm font-semibold leading-5 text-slate-600 dark:text-[#A7B3BC]">{insight.message}</p>
        </div>
        {dismissible ? (
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss insight"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-xl text-slate-400 transition hover:bg-white/70 hover:text-slate-600 dark:text-[#6F7D87] dark:hover:bg-[#1D2A32] dark:hover:text-[#F4F7F6]"
          >
            <X size={15} />
          </button>
        ) : null}
      </div>
    </article>
  );
}

function storageKey(id: string) {
  return `spendfence-dismissed-insight:${id}`;
}

function InsightChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="shrink-0 rounded-full border border-white/70 bg-white/70 px-2 py-0.5 text-[0.68rem] font-black leading-5 text-slate-600 dark:border-[rgb(31_209_165_/_0.2)] dark:bg-[#1D2A32] dark:text-[#A7B3BC]">
      {children}
    </span>
  );
}
