"use client";

import { AlertTriangle, CheckCircle2, LockKeyhole } from "lucide-react";
import { categoryProgress, formatMoney, statusClasses, statusCopy, warningMessage } from "@/lib/budget";
import type { Category, Purchase } from "@/lib/types";
import { CategoryIcon } from "@/components/category-icons";
import { Card, Pill, ProgressBar } from "@/components/ui";

export function CategoryCard({ category, purchases }: { category: Category; purchases: Purchase[] }) {
  const progress = categoryProgress(category, purchases);
  const Icon = progress.status === "locked" ? LockKeyhole : progress.status === "warning" ? AlertTriangle : CheckCircle2;

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-xl text-white shadow-soft" style={{ background: category.color }}>
              <CategoryIcon icon={category.icon} size={15} />
            </span>
            <h2 className="text-base font-black text-[#10201c] sm:text-lg">{category.name}</h2>
          </div>
          <p className="mt-1 text-xs font-bold text-slate-500 sm:text-sm">{formatMoney(progress.remaining)} remaining</p>
        </div>
        <Pill className={statusClasses(progress.status)}>
          <Icon size={13} className="mr-1" />
          {statusCopy(progress.status)}
        </Pill>
      </div>

      <div className="mt-4 sm:mt-5">
        <div className="mb-2 flex items-center justify-between text-xs font-black sm:text-sm">
          <span>{formatMoney(progress.spent)}</span>
          <span className="text-slate-500">{formatMoney(category.limit)}</span>
        </div>
        <ProgressBar percent={progress.percent} color={progress.status === "locked" ? "#fb7185" : progress.status === "warning" ? "#f59e0b" : category.color} />
      </div>
      <p className="mt-2.5 text-sm font-semibold leading-5 text-slate-600 sm:mt-3">{warningMessage(category, purchases)}</p>
    </Card>
  );
}
