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

const roomLeftCard =
  "border-[rgb(24_184_137_/_0.24)] bg-[linear-gradient(135deg,#182229_0%,#1D2E2A_100%)] text-[#F4F7F6] shadow-[0_18px_40px_rgb(0_0_0_/_0.22)]";
const roomLeftIcon = "bg-[#243038] text-[#7EF2D4] shadow-[0_0_24px_rgb(24_184_137_/_0.22)] ring-1 ring-[rgb(126_242_212_/_0.18)]";
const roomLeftDismiss = "text-[#6F7D87] hover:bg-[#243038] hover:text-[#F4F7F6]";

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
  const isRoomLeft = insight.id === "dashboard-most-under-limit";

  function dismiss() {
    if (!insight) return;
    window.sessionStorage.setItem(storageKey(insight.id), "1");
    setDismissed(true);
  }

  return (
    <article
      className={cn(
        "rounded-2xl border px-3 py-3 shadow-soft backdrop-blur transition duration-200 hover:shadow-float sm:px-4",
        isRoomLeft ? roomLeftCard : stylesBySeverity[insight.severity],
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-xl", isRoomLeft ? roomLeftIcon : iconStylesBySeverity[insight.severity])}>
          <Icon size={17} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
            <h2 className={cn("min-w-0 truncate text-sm font-black sm:text-base", isRoomLeft ? "text-[#F4F7F6]" : "text-[#10201c]")}>{insight.title}</h2>
            {insight.categoryLabel ? <InsightChip roomLeft={isRoomLeft}>{insight.categoryLabel}</InsightChip> : null}
            {insight.supportingMetric ? <InsightChip roomLeft={isRoomLeft}>{insight.supportingMetric}</InsightChip> : null}
          </div>
          <p className={cn("mt-1 text-sm font-semibold leading-5", isRoomLeft ? "text-[#A7B3BC]" : "text-slate-600", compact && "line-clamp-3")}>{insight.message}</p>
        </div>
        {dismissible ? (
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss insight"
            className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-xl transition", isRoomLeft ? roomLeftDismiss : "text-slate-400 hover:bg-white/70 hover:text-slate-600")}
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

function InsightChip({ children, roomLeft = false }: { children: React.ReactNode; roomLeft?: boolean }) {
  return (
    <span
      className={cn(
        "shrink-0 rounded-full border px-2 py-0.5 text-[0.68rem] font-black leading-5",
        roomLeft ? "border-[rgb(24_184_137_/_0.25)] bg-[#243038] text-[#E8F5F1] shadow-[0_0_18px_rgb(24_184_137_/_0.1)]" : "border-white/70 bg-white/70 text-slate-600"
      )}
    >
      {children}
    </span>
  );
}
