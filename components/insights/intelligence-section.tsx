"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Brain, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export const intelligenceCardSurfaceClass =
  "relative overflow-hidden rounded-2xl border border-[var(--app-border)] bg-[var(--app-secondary)] p-3 shadow-none transition-[box-shadow,opacity] duration-200 ease-out dark:border-[#26343D] dark:bg-[#182229] sm:p-3.5";

export function IntelligenceSection({
  title,
  tierLabel,
  tierIcon: TierIcon = Brain,
  sourceLabel,
  premiumLabel,
  tierDescription,
  loading = false,
  onRefresh,
  refreshDisabled = false,
  children,
  dots,
  className
}: {
  title: string;
  tierLabel: string;
  tierIcon?: LucideIcon;
  sourceLabel?: string;
  premiumLabel?: string;
  tierDescription?: string;
  loading?: boolean;
  onRefresh?: () => void;
  refreshDisabled?: boolean;
  children: ReactNode;
  dots?: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("mb-4 sm:mb-5", className)}>
      <div className="mb-2.5 flex flex-wrap items-end justify-between gap-2 sm:mb-3">
        <div className="min-w-0">
          <h2 className="text-xl font-black tracking-tight text-white [text-shadow:0_1px_10px_rgb(11_17_20_/_0.38)] sm:text-2xl">{title}</h2>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <IntelligencePill tone="accent">
              <TierIcon size={12} /> {tierLabel}
            </IntelligencePill>
            {premiumLabel ? <IntelligencePill tone="premium">{premiumLabel}</IntelligencePill> : null}
          </div>
          {tierDescription ? <p className="mt-1.5 max-w-md text-xs font-semibold leading-5 text-white/72">{tierDescription}</p> : null}
        </div>
        <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
          {sourceLabel ? <IntelligencePill>{sourceLabel}</IntelligencePill> : null}
          {loading ? <IntelligencePill>Updating</IntelligencePill> : null}
          {onRefresh ? (
            <button
              type="button"
              onClick={onRefresh}
              disabled={refreshDisabled}
              className="inline-flex h-7 items-center gap-1 rounded-full border border-[var(--app-border)] bg-[var(--app-card)] px-2 text-[0.68rem] font-black text-[var(--app-text-muted)] transition hover:text-[var(--brand-primary)] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#121A1F] sm:text-xs"
            >
              <RefreshCw size={11} className={cn(loading && "animate-spin")} />
              Refresh
            </button>
          ) : null}
        </div>
      </div>

      <div className="overflow-hidden rounded-[1.15rem] border border-[var(--app-border)] bg-[var(--app-card)] shadow-soft backdrop-blur dark:bg-[#121A1F] sm:rounded-[1.55rem]">
        {children}
        {dots}
      </div>
    </section>
  );
}

export function IntelligenceEmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="p-3 sm:p-4">
      <div className="rounded-2xl border border-dashed border-[var(--app-border)] bg-[var(--app-secondary)] p-3 dark:bg-[#182229] sm:p-3.5">
        <p className="text-sm font-black text-[var(--app-text)]">{title}</p>
        <p className="mt-1 text-xs font-semibold leading-5 text-[var(--app-text-muted)]">{body}</p>
      </div>
    </div>
  );
}

export function IntelligenceCarouselDots({ count, activeIndex, className }: { count: number; activeIndex: number; className?: string }) {
  if (count < 2) return null;
  return (
    <div className={cn("flex items-center justify-center gap-1.5 px-3 pb-3 sm:pb-4", className)} aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <span key={index} className={cn("h-1.5 rounded-full transition-all duration-200", index === activeIndex ? "w-5 bg-[var(--brand-primary)]" : "w-1.5 bg-[var(--app-border)]")} />
      ))}
    </div>
  );
}

function IntelligencePill({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "accent" | "premium" }) {
  return (
    <span
      className={cn(
        "inline-flex h-7 items-center gap-1 rounded-full border px-2 text-[0.68rem] font-black leading-none sm:text-xs",
        tone === "neutral" && "border-[var(--app-border)] bg-[var(--app-card)] text-[var(--app-text-muted)] dark:bg-[#121A1F]",
        tone === "accent" && "border-[rgb(31_209_165_/_0.25)] bg-[rgb(31_209_165_/_0.1)] text-[var(--brand-primary)]",
        tone === "premium" && "border-[rgb(75_140_255_/_0.2)] bg-[rgb(75_140_255_/_0.1)] text-[var(--app-info)]"
      )}
    >
      {children}
    </span>
  );
}
