"use client";

import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, LockKeyhole } from "lucide-react";
import { categoryProgress, formatMoney, statusClasses, statusColor, statusCopy, warningMessage } from "@/lib/budget";
import type { AdaptiveFenceSuggestion, BudgetMonth, Category, Purchase } from "@/lib/types";
import { CategoryIcon } from "@/components/category-icons";
import { Pill, ProgressBar } from "@/components/ui";
import { cn } from "@/lib/utils";

export function CategoryCard({
  category,
  purchases,
  budgetMonth,
  variant = "full",
  guidance,
  actions
}: {
  category: Category;
  purchases: Purchase[];
  budgetMonth?: BudgetMonth;
  variant?: "full" | "compact";
  guidance?: AdaptiveFenceSuggestion;
  actions?: ReactNode;
}) {
  const progress = categoryProgress(category, purchases, budgetMonth);
  const Icon = progress.status === "locked" ? LockKeyhole : progress.status === "warning" ? AlertTriangle : CheckCircle2;
  const stateColor = statusColor(progress.status);
  const compactStatus = progress.status === "locked" ? "Limit" : progress.status === "warning" ? "Watch" : "Safe";

  if (variant === "compact") {
    return (
      <div
        className={cn(
          "relative grid min-h-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 overflow-hidden border-t border-[var(--glass-hairline)] px-0 py-3 transition first:border-t-0 sm:flex sm:min-h-[8.4rem] sm:flex-col sm:items-stretch sm:rounded-[1rem] sm:border sm:border-[var(--glass-hairline)] sm:[background:var(--glass-interactive-bg)] sm:p-3 sm:shadow-[inset_0_1px_0_var(--glass-edge)] sm:hover:[background:var(--glass-focused-bg)]",
          progress.status === "locked" && "sm:bg-[rgb(207_113_109_/_0.10)]",
          progress.status === "warning" && "sm:bg-[rgb(200_155_83_/_0.10)]"
        )}
      >
        <span className="absolute inset-y-3 left-0 hidden w-0.5 rounded-r-full opacity-80 sm:inset-x-4 sm:inset-y-auto sm:top-0 sm:block sm:h-px sm:w-auto" style={{ background: stateColor }} />
        <div className="contents sm:flex sm:items-start sm:justify-between sm:gap-2 sm:pt-1">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[0.8rem] text-white shadow-[inset_0_1px_0_rgb(255_255_255_/_0.20),0_8px_18px_rgb(0_0_0_/_0.20)] sm:h-9 sm:w-9" style={{ background: category.color }}>
            <CategoryIcon icon={category.icon} size={16} />
          </span>
          <span className="order-3 mt-0.5 flex min-h-6 items-center gap-1 rounded-[0.72rem] border border-[var(--glass-border)] [background:var(--glass-interactive-bg)] px-2 text-[0.64rem] font-black text-[var(--app-text-secondary)] shadow-[inset_0_1px_0_var(--glass-edge)] sm:order-none">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: stateColor }} />
            {compactStatus}
          </span>
        </div>

        <div className="min-w-0 sm:mt-2.5">
          <h2 className="text-sm font-black leading-5 text-[#10201c] sm:text-base">{category.name}</h2>
          <p className="mt-0.5 text-xs font-bold text-[var(--app-text-muted)] sm:hidden">
            {formatMoney(progress.spent)} of {formatMoney(category.limit)} used
          </p>
        </div>

        <div className="col-span-3 mt-1 grid gap-2 sm:mt-auto sm:pt-2.5">
          <ProgressBar percent={progress.percent} color={stateColor} compact />
          <div className="hidden gap-1 sm:grid">
            <p className="text-[0.7rem] font-black leading-4 text-slate-500 sm:text-xs">
              {formatMoney(progress.spent)} of {formatMoney(category.limit)} used
            </p>
            <p className="text-xs font-black leading-4 text-[#10201c] sm:text-sm">
              {formatMoney(progress.remaining)} left
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden border-t border-[var(--glass-hairline)] px-0 py-4 first:border-t-0 sm:rounded-[1rem] sm:border sm:border-[var(--glass-hairline)] sm:[background:var(--glass-interactive-bg)] sm:p-4 sm:shadow-[inset_0_1px_0_var(--glass-edge)] sm:backdrop-blur-[10px]">
      <span className="pointer-events-none absolute inset-x-0 top-0 hidden h-px bg-[var(--glass-edge)] sm:block" />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-start gap-2">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-[0.72rem] text-white shadow-[inset_0_1px_0_rgb(255_255_255_/_0.20),0_7px_16px_rgb(0_0_0_/_0.18)]" style={{ background: category.color }}>
              <CategoryIcon icon={category.icon} size={15} />
            </span>
            <h2 className="text-base font-black leading-5 text-[var(--app-text)] sm:text-lg sm:leading-6">{category.name}</h2>
          </div>
          <p className="mt-1 text-xs font-bold text-[var(--app-text-muted)] sm:text-sm">{formatMoney(progress.remaining)} remaining</p>
        </div>
        <div className="flex shrink-0 items-start gap-1.5">
          <Pill className={cn(statusClasses(progress.status), "border-transparent")}>
            <Icon size={13} className="mr-1" />
            {statusCopy(progress.status)}
          </Pill>
          {actions}
        </div>
      </div>

      <div className="mt-4 sm:mt-5">
        <div className="mb-2 flex items-center justify-between text-xs font-black sm:text-sm">
          <span>{formatMoney(progress.spent)}</span>
          <span className="text-slate-500">{formatMoney(category.limit)}</span>
        </div>
        <ProgressBar percent={progress.percent} color={stateColor} />
      </div>
      <p className="mt-2.5 text-sm font-semibold leading-5 text-slate-600 sm:mt-3">{warningMessage(category, purchases, budgetMonth)}</p>
      {guidance ? (
        <div className="mt-3 border-l border-[rgb(139_151_220_/_0.34)] py-0.5 pl-3">
          <p className="text-[0.66rem] font-black uppercase tracking-[0.14em] text-[var(--app-intelligence)]">Suggested</p>
          <p className="mt-1 text-sm font-black leading-5 text-[var(--app-text)]">{guidance.suggestedAction}</p>
          <p className="mt-0.5 text-xs font-semibold leading-5 text-[var(--app-text-secondary)]">
            {guidance.suggestedLimit ? `${formatMoney(guidance.currentLimit)} current fence, ${formatMoney(guidance.suggestedLimit)} suggested.` : guidance.explanation}
          </p>
        </div>
      ) : null}
    </div>
  );
}
