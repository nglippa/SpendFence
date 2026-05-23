"use client";

import { useEffect, useState } from "react";
import { Activity, AlertCircle, CheckCircle2, LineChart, ShieldCheck, X } from "lucide-react";
import type { BehavioralInsight } from "@/lib/insights/insight-types";
import { cn } from "@/lib/utils";

const iconByType = {
  positive_control: ShieldCheck,
  recovery: CheckCircle2,
  stabilization: Activity,
  gentle_caution: AlertCircle,
  trend: LineChart,
  empty: Activity
};

const stylesBySeverity = {
  calm: "border-slate-200/80 bg-white/88 text-slate-700",
  positive: "border-emerald-100 bg-emerald-50/80 text-emerald-800",
  watch: "border-amber-100 bg-amber-50/80 text-amber-900",
  limit: "border-rose-100 bg-rose-50/80 text-rose-800"
};

const iconStylesBySeverity = {
  calm: "bg-slate-100 text-slate-600",
  positive: "bg-white/80 text-emerald-700",
  watch: "bg-white/80 text-amber-800",
  limit: "bg-white/80 text-rose-700"
};

export function SpendInsightCard({
  insight,
  dismissible = true,
  className,
  compact = false
}: {
  insight?: BehavioralInsight;
  dismissible?: boolean;
  className?: string;
  compact?: boolean;
}) {
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
    <article className={cn("rounded-2xl border px-3 py-3 shadow-soft backdrop-blur transition duration-200 hover:-translate-y-0.5 hover:shadow-float sm:px-4", stylesBySeverity[insight.severity], className)}>
      <div className="flex items-start gap-3">
        <div className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-xl", iconStylesBySeverity[insight.severity])}>
          <Icon size={17} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
            <h2 className="min-w-0 truncate text-sm font-black text-[#10201c] sm:text-base">{insight.title}</h2>
            {insight.categoryLabel ? <InsightChip>{insight.categoryLabel}</InsightChip> : null}
            {insight.supportingMetric ? <InsightChip>{insight.supportingMetric}</InsightChip> : null}
          </div>
          <p className={cn("mt-1 text-sm font-semibold leading-5 text-slate-600", compact && "line-clamp-3")}>{insight.message}</p>
        </div>
        {dismissible ? (
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss insight"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-xl text-slate-400 transition hover:bg-white/70 hover:text-slate-600"
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
  return <span className="shrink-0 rounded-full border border-white/70 bg-white/70 px-2 py-0.5 text-[0.68rem] font-black leading-5 text-slate-600">{children}</span>;
}
