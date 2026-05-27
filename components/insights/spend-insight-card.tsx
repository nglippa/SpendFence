"use client";

import { useEffect, useState } from "react";
import type { ComponentPropsWithoutRef } from "react";
import { Activity, AlertCircle, CheckCircle2, LineChart, ListChecks, ShieldCheck, X } from "lucide-react";
import { intelligenceAccentRailClass, intelligenceCardSurfaceClass, intelligenceIconSurfaceClass } from "@/components/insights/intelligence-section";
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
  calm: intelligenceIconSurfaceClass,
  positive: intelligenceIconSurfaceClass,
  watch: "grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-[linear-gradient(135deg,#312E81,#4F46E5_52%,#F59E0B)] text-white shadow-[0_10px_24px_rgb(99_102_241_/_0.20)] ring-1 ring-white/70 dark:ring-white/10 sm:h-10 sm:w-10",
  limit: "grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-[linear-gradient(135deg,#312E81,#7C3AED_50%,#E11D48)] text-white shadow-[0_10px_24px_rgb(124_58_237_/_0.20)] ring-1 ring-white/70 dark:ring-white/10 sm:h-10 sm:w-10"
};

const accentBySeverity = {
  calm: intelligenceAccentRailClass,
  positive: intelligenceAccentRailClass,
  watch: "pointer-events-none absolute inset-y-4 left-0 w-1 rounded-r-full bg-gradient-to-b from-[#93C5FD] via-[#6366F1] to-[#F59E0B] shadow-[0_0_24px_rgb(99_102_241_/_0.28)]",
  limit: "pointer-events-none absolute inset-y-4 left-0 w-1 rounded-r-full bg-gradient-to-b from-[#93C5FD] via-[#7C3AED] to-[#E11D48] shadow-[0_0_24px_rgb(124_58_237_/_0.30)]"
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
        "backdrop-blur",
        className
      )}
    >
      <span className={accentBySeverity[insight.severity]} aria-hidden="true" />
      <div className="pointer-events-none absolute -right-16 -top-16 h-32 w-32 rounded-full bg-[rgb(99_102_241_/_0.12)] blur-2xl" />
      <div className="flex items-start gap-3">
        <div className={iconStylesBySeverity[insight.severity]}>
          <Icon size={17} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
            <h2 className="min-w-0 text-sm font-black leading-5 text-[#10201c] dark:text-[#F4F7F6] sm:text-base sm:leading-6">{insight.title}</h2>
            {insight.categoryLabel ? <InsightChip>{insight.categoryLabel}</InsightChip> : null}
            {insight.supportingMetric ? <InsightChip>{insight.supportingMetric}</InsightChip> : null}
          </div>
          <p className="mt-1 text-sm font-semibold leading-5 text-[#536173] dark:text-[#A7B3BC]">{insight.message}</p>
        </div>
        {dismissible ? (
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss insight"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-xl text-slate-400 transition hover:bg-white/70 hover:text-slate-600 dark:text-[#6F7D87] dark:hover:bg-white/[0.06] dark:hover:text-[#F4F7F6]"
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
    <span className="shrink-0 rounded-full border border-[rgb(99_102_241_/_0.16)] bg-white/70 px-2 py-0.5 text-[0.68rem] font-black leading-5 text-slate-600 dark:border-white/10 dark:bg-white/[0.06] dark:text-[#A7B3BC]">
      {children}
    </span>
  );
}
