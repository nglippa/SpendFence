"use client";

import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, LockKeyhole } from "lucide-react";
import { categoryProgress, formatMoney, statusClasses, statusColor, statusCopy, warningMessage } from "@/lib/budget";
import type { BudgetMonth, Category, Purchase } from "@/lib/types";
import { CategoryIcon } from "@/components/category-icons";
import { Card, Pill, ProgressBar } from "@/components/ui";
import { cn } from "@/lib/utils";

export function CategoryCard({
  category,
  purchases,
  budgetMonth,
  variant = "full",
  actions
}: {
  category: Category;
  purchases: Purchase[];
  budgetMonth?: BudgetMonth;
  variant?: "full" | "compact";
  actions?: ReactNode;
}) {
  const progress = categoryProgress(category, purchases, budgetMonth);
  const Icon = progress.status === "locked" ? LockKeyhole : progress.status === "warning" ? AlertTriangle : CheckCircle2;
  const stateColor = statusColor(progress.status);
  const compactStatus = progress.status === "locked" ? "Limit" : progress.status === "warning" ? "Watch" : "Safe";

  if (variant === "compact") {
    return (
      <Card
        className={cn(
          "relative flex min-h-[9.25rem] flex-col overflow-hidden p-3 transition hover:shadow-float sm:min-h-[9.5rem]",
          progress.status === "locked" && "border-rose-100 bg-rose-50/70",
          progress.status === "warning" && "border-amber-100 bg-amber-50/60"
        )}
      >
        <span className="absolute inset-x-0 top-0 h-1" style={{ background: stateColor }} />
        <div className="flex items-start justify-between gap-2 pt-1">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl text-white shadow-soft sm:h-9 sm:w-9" style={{ background: category.color }}>
            <CategoryIcon icon={category.icon} size={16} />
          </span>
          <span className="mt-0.5 flex items-center gap-1 rounded-full bg-white/80 px-1.5 py-0.5 text-[0.64rem] font-black text-slate-600 shadow-soft">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: stateColor }} />
            {compactStatus}
          </span>
        </div>

        <div className="mt-2.5 min-w-0">
          <h2 className="text-sm font-black leading-5 text-[#10201c] sm:text-base">{category.name}</h2>
        </div>

        <div className="mt-auto grid gap-2 pt-2.5">
          <ProgressBar percent={progress.percent} color={stateColor} compact />
          <div className="grid gap-1">
            <p className="text-[0.7rem] font-black leading-4 text-slate-500 sm:text-xs">
              {formatMoney(progress.spent)} of {formatMoney(category.limit)} used
            </p>
            <p className="text-xs font-black leading-4 text-[#10201c] sm:text-sm">
              {formatMoney(progress.remaining)} left
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-start gap-2">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-xl text-white shadow-soft" style={{ background: category.color }}>
              <CategoryIcon icon={category.icon} size={15} />
            </span>
            <h2 className="text-base font-black leading-5 text-[var(--app-text)] sm:text-lg sm:leading-6">{category.name}</h2>
          </div>
          <p className="mt-1 text-xs font-bold text-[var(--app-text-muted)] sm:text-sm">{formatMoney(progress.remaining)} remaining</p>
        </div>
        <div className="flex shrink-0 items-start gap-1.5">
          <Pill className={statusClasses(progress.status)}>
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
    </Card>
  );
}
