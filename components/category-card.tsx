"use client";

import { AlertTriangle, CheckCircle2, LockKeyhole } from "lucide-react";
import { categoryProgress, formatMoney, statusClasses, statusCopy, warningMessage } from "@/lib/budget";
import type { Category, Purchase } from "@/lib/types";
import { Card, Pill, ProgressBar } from "@/components/ui";

export function CategoryCard({ category, purchases }: { category: Category; purchases: Purchase[] }) {
  const progress = categoryProgress(category, purchases);
  const Icon = progress.status === "locked" ? LockKeyhole : progress.status === "warning" ? AlertTriangle : CheckCircle2;

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full" style={{ background: category.color }} />
            <h2 className="text-lg font-black text-[#10201c]">{category.name}</h2>
          </div>
          <p className="mt-1 text-sm font-bold text-slate-500">{formatMoney(progress.remaining)} remaining</p>
        </div>
        <Pill className={statusClasses(progress.status)}>
          <Icon size={13} className="mr-1" />
          {statusCopy(progress.status)}
        </Pill>
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between text-sm font-black">
          <span>{formatMoney(progress.spent)}</span>
          <span className="text-slate-500">{formatMoney(category.limit)}</span>
        </div>
        <ProgressBar percent={progress.percent} color={progress.status === "locked" ? "#fb7185" : progress.status === "warning" ? "#f59e0b" : category.color} />
      </div>
      <p className="mt-3 text-sm font-semibold leading-5 text-slate-600">{warningMessage(category, purchases)}</p>
    </Card>
  );
}
