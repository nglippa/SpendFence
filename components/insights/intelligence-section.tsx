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
  className,
  variant = "default"
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
  variant?: "default" | "flagship";
}) {
  const [refreshState, setRefreshState] = useState<"idle" | "processing">("idle");
  const refreshWasLoadingRef = useRef(false);
  const processingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refreshIsProcessing = refreshState === "processing" || loading;
  const flagship = variant === "flagship";

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
    <section
      className={cn(
        "mb-4 sm:mb-5",
        flagship &&
          "relative isolate overflow-hidden rounded-[1.65rem] border border-[rgb(24_184_137_/_0.24)] bg-[radial-gradient(circle_at_8%_0%,rgb(126_242_212_/_0.35),transparent_20rem),linear-gradient(145deg,#FFFFFF_0%,#F6FFFB_45%,#E7F8F1_100%)] p-3 shadow-[0_24px_70px_rgb(11_17_20_/_0.13),0_8px_28px_rgb(24_184_137_/_0.12)] dark:border-[rgb(126_242_212_/_0.16)] dark:bg-[radial-gradient(circle_at_8%_0%,rgb(31_209_165_/_0.20),transparent_22rem),linear-gradient(145deg,#121A1F_0%,#0E171B_52%,#10231E_100%)] sm:rounded-[2rem] sm:p-4",
        className
      )}
    >
      {flagship ? (
        <>
          <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-[rgb(31_209_165_/_0.18)] blur-3xl motion-safe:animate-[adaptive-glow_5s_ease-in-out_infinite]" />
          <div className="pointer-events-none absolute -bottom-24 left-1/4 h-44 w-72 rounded-full bg-[rgb(46_211_183_/_0.14)] blur-3xl" />
          <div className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-white/90 to-transparent dark:via-white/18" />
        </>
      ) : null}
      <div className={cn("relative z-10 mb-2.5 flex flex-wrap items-end justify-between gap-2 sm:mb-3", flagship && "px-0.5 pb-1 pt-0.5 sm:px-1 sm:pb-2")}>
        <div className="min-w-0">
          <h2
            className={cn(
              "text-xl font-black tracking-tight sm:text-2xl",
              flagship ? "text-[#0B1114] [text-shadow:0_1px_0_rgb(255_255_255_/_0.7)] dark:text-white dark:[text-shadow:0_1px_12px_rgb(126_242_212_/_0.18)]" : "text-white [text-shadow:0_1px_10px_rgb(11_17_20_/_0.38)]"
            )}
          >
            {title}
          </h2>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <IntelligencePill tone="accent">
              <TierIcon size={12} /> {tierLabel}
            </IntelligencePill>
            {premiumLabel ? <IntelligencePill tone="premium">{premiumLabel}</IntelligencePill> : null}
          </div>
          {tierDescription ? (
            <p className={cn("mt-1.5 max-w-md text-xs font-semibold leading-5", flagship ? "text-[#43564F] dark:text-white/72" : "text-white/72")}>
              {tierDescription}
            </p>
          ) : null}
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

      <div
        className={cn(
          "relative z-10 overflow-hidden rounded-[1.15rem] border border-[var(--app-border)] bg-[var(--app-card)] shadow-soft backdrop-blur dark:bg-[#121A1F] sm:rounded-[1.55rem]",
          flagship &&
            "border-white/80 bg-[rgb(255_255_255_/_0.82)] shadow-[inset_0_1px_0_rgb(255_255_255_/_0.85),0_18px_48px_rgb(11_17_20_/_0.10)] backdrop-blur-xl dark:border-white/10 dark:bg-[rgb(11_17_20_/_0.46)] dark:shadow-[inset_0_1px_0_rgb(255_255_255_/_0.08),0_20px_54px_rgb(0_0_0_/_0.26)]"
        )}
      >
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
