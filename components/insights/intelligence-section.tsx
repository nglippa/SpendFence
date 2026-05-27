"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Brain, RefreshCw } from "lucide-react";
import { PremiumBadge } from "@/components/upgrade-modal";
import { cn } from "@/lib/utils";

export const intelligenceCardSurfaceClass =
  "relative overflow-hidden rounded-2xl border border-[rgb(99_102_241_/_0.16)] bg-[radial-gradient(circle_at_14%_0%,rgb(124_58_237_/_0.10),transparent_12rem),linear-gradient(145deg,#FFFFFF_0%,#F8FAFF_52%,#F2F5FF_100%)] p-3 shadow-[0_14px_34px_rgb(31_41_55_/_0.08)] transition-[box-shadow,transform,border-color,opacity] duration-300 ease-out hover:-translate-y-0.5 hover:border-[rgb(99_102_241_/_0.26)] hover:shadow-[0_18px_44px_rgb(31_41_55_/_0.12),0_10px_26px_rgb(99_102_241_/_0.10)] dark:border-white/10 dark:bg-[radial-gradient(circle_at_14%_0%,rgb(124_58_237_/_0.16),transparent_13rem),linear-gradient(145deg,#18202B_0%,#121821_58%,#15142A_100%)] dark:shadow-[0_14px_34px_rgb(0_0_0_/_0.26)] sm:p-3.5";

export const intelligenceCarouselTrackClass =
  "flex snap-x snap-mandatory items-stretch gap-3 overflow-x-auto overscroll-x-contain scroll-smooth px-3.5 py-3.5 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-5 sm:px-5 sm:py-5";

export const intelligenceIconSurfaceClass =
  "grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-[linear-gradient(135deg,#1E1B4B,#4F46E5_52%,#7C3AED)] text-white shadow-[0_10px_24px_rgb(79_70_229_/_0.24)] ring-1 ring-white/70 dark:ring-white/10 sm:h-10 sm:w-10";

export const intelligenceAccentRailClass =
  "pointer-events-none absolute inset-y-4 left-0 w-1 rounded-r-full bg-gradient-to-b from-[#93C5FD] via-[#6366F1] to-[#8B5CF6] shadow-[0_0_24px_rgb(99_102_241_/_0.32)]";

const intelligenceTagClass =
  "border-[rgb(99_102_241_/_0.28)] bg-[rgb(99_102_241_/_0.09)] text-[#4F46E5] shadow-[0_6px_18px_rgb(99_102_241_/_0.10)] dark:text-[#C4B5FD]";

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
  variant = "default",
  premiumHref = "/settings/premium"
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
  premiumHref?: string;
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
        "relative isolate mb-4 overflow-hidden rounded-[1.65rem] border border-[rgb(99_102_241_/_0.18)] bg-[radial-gradient(circle_at_8%_0%,rgb(124_58_237_/_0.14),transparent_20rem),linear-gradient(145deg,#FFFFFF_0%,#F7F8FF_48%,#EEF2FF_100%)] p-3 shadow-[0_24px_70px_rgb(15_23_42_/_0.12),0_8px_28px_rgb(99_102_241_/_0.10)] dark:border-[rgb(147_197_253_/_0.13)] dark:bg-[radial-gradient(circle_at_8%_0%,rgb(99_102_241_/_0.18),transparent_22rem),linear-gradient(145deg,#121821_0%,#0D121A_52%,#151326_100%)] sm:mb-5 sm:rounded-[2rem] sm:p-4",
        className
      )}
    >
      <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-[rgb(99_102_241_/_0.17)] blur-3xl motion-safe:animate-[adaptive-glow_5s_ease-in-out_infinite]" />
      <div className="pointer-events-none absolute -bottom-24 left-1/4 h-44 w-72 rounded-full bg-[rgb(59_130_246_/_0.12)] blur-3xl" />
      <div className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-white/90 to-transparent dark:via-white/18" />
      <div className={cn("relative z-10 mb-2.5 flex flex-wrap items-end justify-between gap-2 px-0.5 pb-1 pt-0.5 sm:mb-3 sm:px-1 sm:pb-2", !flagship && "sm:pb-1.5")}>
        <div className="min-w-0">
          <h2 className="text-xl font-black tracking-tight text-[#0B1114] [text-shadow:0_1px_0_rgb(255_255_255_/_0.7)] dark:text-white dark:[text-shadow:0_1px_12px_rgb(147_197_253_/_0.14)] sm:text-2xl">
            {title}
          </h2>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <IntelligencePill tone="accent">
              <TierIcon size={12} /> {tierLabel}
            </IntelligencePill>
          </div>
          {tierDescription ? (
            <p className="mt-1.5 max-w-md text-xs font-semibold leading-5 text-[#475569] dark:text-white/72">
              {tierDescription}{" "}
              {premiumLabel ? (
                <Link href={premiumHref} className="inline-flex align-baseline transition hover:brightness-105 focus:outline-none focus:ring-4 focus:ring-[rgb(75_140_255_/_0.16)]">
                  <PremiumBadge />
                </Link>
              ) : null}
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
                  "border-[rgb(99_102_241_/_0.28)] bg-[rgb(99_102_241_/_0.09)] text-[#4F46E5] shadow-[0_6px_18px_rgb(99_102_241_/_0.10)] hover:border-[rgb(99_102_241_/_0.42)] hover:bg-[rgb(99_102_241_/_0.13)] dark:text-[#C4B5FD]",
                  refreshIsProcessing && "border-[rgb(99_102_241_/_0.48)] bg-[rgb(99_102_241_/_0.16)] text-[#4338CA] shadow-[0_8px_24px_rgb(99_102_241_/_0.16)] dark:text-[#DDD6FE]",
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
        className="relative z-10 overflow-hidden rounded-[1.15rem] border border-white/80 bg-[rgb(255_255_255_/_0.82)] shadow-[inset_0_1px_0_rgb(255_255_255_/_0.85),0_18px_48px_rgb(15_23_42_/_0.10)] backdrop-blur-xl dark:border-white/10 dark:bg-[rgb(8_13_22_/_0.50)] dark:shadow-[inset_0_1px_0_rgb(255_255_255_/_0.08),0_20px_54px_rgb(0_0_0_/_0.28)] sm:rounded-[1.55rem]"
      >
        {children}
        {dots}
      </div>
    </section>
  );
}

export function IntelligenceEmptyState({ title, body, loading = false }: { title: string; body: string; loading?: boolean }) {
  return (
    <div className="p-3.5 sm:p-5">
      <div className="relative overflow-hidden rounded-2xl border border-dashed border-[rgb(99_102_241_/_0.22)] bg-[radial-gradient(circle_at_10%_0%,rgb(124_58_237_/_0.10),transparent_13rem),linear-gradient(145deg,#FFFFFF,#F5F7FF)] p-3.5 dark:border-white/10 dark:bg-[radial-gradient(circle_at_10%_0%,rgb(99_102_241_/_0.14),transparent_13rem),linear-gradient(145deg,#18202B,#111722)] sm:p-4">
        <div className="pointer-events-none absolute -right-12 -top-16 h-32 w-32 rounded-full bg-[rgb(99_102_241_/_0.14)] blur-2xl" />
        <div className="relative flex gap-3">
          <div className={cn(intelligenceIconSurfaceClass, "h-10 w-10")}>
            <Brain size={18} className={cn(loading && "motion-safe:animate-pulse")} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-black text-[var(--app-text)]">{title}</p>
            <p className="mt-1 text-xs font-semibold leading-5 text-[var(--app-text-muted)]">{body}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function IntelligenceCarouselDots({ count, activeIndex, className }: { count: number; activeIndex: number; className?: string }) {
  if (count < 2) return null;
  return (
    <div className={cn("flex items-center justify-center gap-1.5 px-3 pb-3 sm:pb-4", className)} aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <span key={index} className={cn("h-1.5 rounded-full transition-all duration-200", index === activeIndex ? "w-5 bg-[#6366F1]" : "w-1.5 bg-[rgb(99_102_241_/_0.20)] dark:bg-white/[0.14]")} />
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
        tone === "premium" && "border-[rgb(75_140_255_/_0.18)] bg-[rgb(75_140_255_/_0.08)] text-[var(--app-info)] shadow-[0_6px_18px_rgb(75_140_255_/_0.10)]"
      )}
    >
      {children}
    </span>
  );
}
