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
  watch: "grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[rgb(200_155_83_/_0.14)] text-[var(--app-warning)] ring-1 ring-[rgb(200_155_83_/_0.18)]",
  limit: "grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[rgb(207_113_109_/_0.14)] text-[var(--app-danger)] ring-1 ring-[rgb(207_113_109_/_0.18)]"
};

const accentBySeverity = {
  calm: intelligenceAccentRailClass,
  positive: intelligenceAccentRailClass,
  watch: "pointer-events-none absolute inset-y-3 left-0 w-0.5 rounded-r-full bg-[rgb(200_155_83_/_0.72)]",
  limit: "pointer-events-none absolute inset-y-3 left-0 w-0.5 rounded-r-full bg-[rgb(207_113_109_/_0.76)]"
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
        "py-3.5",
        className
      )}
    >
      <span className={accentBySeverity[insight.severity]} aria-hidden="true" />
      <div className="flex items-start gap-3 pl-1">
        <div className={iconStylesBySeverity[insight.severity]}>
          <Icon size={17} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
            <h2 className="min-w-0 text-sm font-black leading-5 text-[var(--app-text)] sm:text-base sm:leading-6">{insight.title}</h2>
            {insight.categoryLabel ? <InsightChip>{insight.categoryLabel}</InsightChip> : null}
            {insight.supportingMetric ? <InsightChip>{insight.supportingMetric}</InsightChip> : null}
          </div>
          <p className={cn("mt-1 text-sm font-semibold leading-5 text-[var(--app-text-secondary)]", compact && "line-clamp-3")}>{insight.message}</p>
        </div>
        {dismissible ? (
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss insight"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-xl text-[var(--app-text-muted)] transition hover:bg-[rgb(255_255_255_/_0.075)] hover:text-[var(--app-text)]"
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
    <span className="shrink-0 rounded-full border border-[rgb(121_131_189_/_0.14)] bg-[rgb(121_131_189_/_0.075)] px-2 py-0.5 text-[0.66rem] font-black leading-5 text-[var(--app-text-secondary)]">
      {children}
    </span>
  );
}
