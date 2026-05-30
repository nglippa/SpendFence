"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Brain, RefreshCw } from "lucide-react";
import { PremiumBadge } from "@/components/upgrade-modal";
import { cn } from "@/lib/utils";

export const intelligenceCardSurfaceClass =
  "relative overflow-hidden border-t border-[rgb(151_163_220_/_0.13)] bg-transparent px-0 py-3 shadow-none transition-[background,opacity] duration-200 ease-out first:border-t-0 sm:rounded-[0.95rem] sm:border sm:bg-[linear-gradient(180deg,rgb(151_163_220_/_0.075),rgb(255_255_255_/_0.032))] sm:p-3.5 sm:shadow-[inset_0_1px_0_rgb(255_255_255_/_0.11)]";

export const intelligenceIconSurfaceClass =
  "grid h-8 w-8 shrink-0 place-items-center rounded-[0.78rem] bg-[rgb(121_131_189_/_0.13)] text-[var(--app-intelligence)] ring-1 ring-[rgb(151_163_220_/_0.18)] shadow-[inset_0_1px_0_rgb(255_255_255_/_0.12)]";

export const intelligenceAccentRailClass =
  "pointer-events-none absolute inset-y-3 left-0 w-0.5 rounded-r-full bg-[var(--app-intelligence)] opacity-65";

const intelligenceTagClass =
  "border-[rgb(121_131_189_/_0.16)] bg-[rgb(121_131_189_/_0.085)] text-[var(--app-intelligence)]";

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
  className,
  variant = "default",
  premiumHref = "/premium"
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
        "ai-flow-layer relative mb-5 p-4 sm:mb-6 sm:p-5",
        className
      )}
    >
      <div className={cn("relative z-10 mb-3 flex flex-wrap items-start justify-between gap-2", !flagship && "sm:mb-2.5")}>
        <div className="min-w-0">
          <h2 className="text-lg font-black tracking-tight text-[var(--app-text)] sm:text-xl">
            {title}
          </h2>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <IntelligencePill tone="accent">
              <TierIcon size={12} /> {tierLabel}
            </IntelligencePill>
          </div>
          {tierDescription ? (
            <p className="mt-1.5 max-w-lg text-xs font-semibold leading-5 text-[var(--app-text-secondary)]">
              {tierDescription}{" "}
              {premiumLabel ? (
                <Link href={premiumHref} className="inline-flex align-baseline transition hover:brightness-105 focus:outline-none focus:ring-4 focus:ring-[rgb(127_151_189_/_0.16)]">
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
                  "inline-flex h-8 items-center gap-1 rounded-[0.72rem] border px-2.5 text-[0.68rem] font-black transition-[background,border-color,color,opacity] disabled:cursor-not-allowed sm:text-xs",
                  "border-[rgb(151_163_220_/_0.16)] [background:var(--glass-interactive-bg)] text-[var(--app-intelligence)] shadow-[inset_0_1px_0_var(--glass-edge)] hover:[background:var(--glass-focused-bg)]",
                  refreshIsProcessing && "bg-[rgb(121_131_189_/_0.12)]",
                  refreshDisabled && !refreshIsProcessing && "opacity-55"
                )}
              >
                <RefreshCw size={11} className={cn(refreshIsProcessing && "animate-spin")} />
                Refresh
              </button>
            </>
          ) : null}
        </div>
      </div>

      <div className="relative z-10 overflow-hidden">
        {children}
      </div>
    </section>
  );
}

export function IntelligenceEmptyState({ title, body, loading = false }: { title: string; body: string; loading?: boolean }) {
  return (
    <div className="border-t border-[rgb(151_163_220_/_0.13)] px-0 py-3.5 first:border-t-0 sm:rounded-[0.95rem] sm:border sm:bg-[linear-gradient(180deg,rgb(151_163_220_/_0.070),rgb(255_255_255_/_0.032))] sm:p-4 sm:shadow-[inset_0_1px_0_rgb(255_255_255_/_0.10)]">
      <div className="flex gap-3">
        <div className={cn(intelligenceIconSurfaceClass, "h-9 w-9")}>
          <Brain size={18} className={cn(loading && "motion-safe:animate-pulse")} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-black text-[var(--app-text)]">{title}</p>
          <p className="mt-1 text-xs font-semibold leading-5 text-[var(--app-text-secondary)]">{body}</p>
        </div>
      </div>
    </div>
  );
}

function IntelligencePill({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "accent" | "premium" }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1 rounded-[0.68rem] border px-2 text-[0.64rem] font-black leading-none shadow-[inset_0_1px_0_rgb(255_255_255_/_0.08)] sm:text-[0.68rem]",
        tone === "neutral" && "border-[var(--app-border)] bg-[var(--app-card)] text-[var(--app-text-muted)] dark:bg-[#121A1F]",
        tone === "accent" && intelligenceTagClass,
        tone === "premium" && "border-[rgb(127_151_189_/_0.18)] bg-[rgb(127_151_189_/_0.08)] text-[var(--app-info)] shadow-[0_6px_18px_rgb(127_151_189_/_0.10)]"
      )}
    >
      {children}
    </span>
  );
}
