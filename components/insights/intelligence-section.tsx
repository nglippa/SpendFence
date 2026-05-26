"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Brain, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export const intelligenceCardSurfaceClass =
  "relative overflow-hidden rounded-2xl border border-[var(--app-border)] bg-[var(--app-secondary)] p-3 shadow-none transition-[box-shadow,opacity] duration-200 ease-out dark:border-[#26343D] dark:bg-[#182229] sm:p-3.5";

const intelligenceTagClass =
  "border-[rgb(31_209_165_/_0.3)] bg-[rgb(31_209_165_/_0.1)] text-[var(--brand-primary)] shadow-[0_6px_18px_rgb(31_209_165_/_0.1)]";

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
  const [refreshState, setRefreshState] = useState<"idle" | "processing">("idle");
  const refreshWasLoadingRef = useRef(false);
  const processingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refreshIsProcessing = refreshState === "processing" || loading;

  useEffect(() => {
    if (loading) {
      if (processingTimerRef.current) clearTimeout(processingTimerRef.current);
      refreshWasLoadingRef.current = true;
      setRefreshState("processing");
      return;
    }

    if (!refreshWasLoadingRef.current) return;
    refreshWasLoadingRef.current = false;
    setRefreshState("idle");
  }, [loading]);

  useEffect(() => {
    return () => {
      if (processingTimerRef.current) clearTimeout(processingTimerRef.current);
    };
  }, []);

  function handleRefresh() {
    if (!onRefresh || refreshDisabled) return;
    if (processingTimerRef.current) clearTimeout(processingTimerRef.current);

    refreshWasLoadingRef.current = loading;
    setRefreshState("processing");
    onRefresh();

    if (!loading) {
      processingTimerRef.current = setTimeout(() => setRefreshState("idle"), 900);
    }
  }

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
          {sourceLabel ? <IntelligencePill tone="accent">{sourceLabel}</IntelligencePill> : null}
          {onRefresh ? (
            <>
              <span className="grid h-7 w-[4.75rem] place-items-end" aria-live="polite">
                <span className={cn("origin-right transition-[opacity,transform] duration-200 ease-out", refreshIsProcessing ? "opacity-100 scale-100" : "pointer-events-none opacity-0 scale-95")} aria-hidden={!refreshIsProcessing}>
                  <IntelligencePill tone="accent">Updating</IntelligencePill>
                </span>
              </span>
              <button
                type="button"
                onClick={handleRefresh}
                disabled={refreshDisabled}
                className={cn(
                  "inline-flex h-7 items-center gap-1 rounded-full border px-2 text-[0.68rem] font-black transition-[background,border-color,box-shadow,color,opacity,transform] duration-500 ease-out hover:-translate-y-px active:translate-y-0 disabled:cursor-not-allowed sm:text-xs",
                  "border-[rgb(31_209_165_/_0.3)] bg-[rgb(31_209_165_/_0.1)] text-[var(--brand-primary)] shadow-[0_6px_18px_rgb(31_209_165_/_0.1)] hover:border-[rgb(31_209_165_/_0.48)] hover:bg-[rgb(31_209_165_/_0.14)] hover:text-[rgb(187_247_208)]",
                  refreshIsProcessing && "border-[rgb(31_209_165_/_0.5)] bg-[rgb(31_209_165_/_0.16)] text-[rgb(187_247_208)] shadow-[0_8px_24px_rgb(31_209_165_/_0.18)]",
                  refreshDisabled && !refreshIsProcessing && "opacity-55 hover:translate-y-0"
                )}
              >
                <RefreshCw size={11} className={cn(refreshIsProcessing && "animate-spin")} />
                Refresh
              </button>
            </>
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
        tone === "accent" && intelligenceTagClass,
        tone === "premium" && "border-[rgb(168_85_247_/_0.28)] bg-[rgb(124_58_237_/_0.12)] text-[rgb(233_213_255)] shadow-[0_6px_18px_rgb(124_58_237_/_0.12)]"
      )}
    >
      {children}
    </span>
  );
}
